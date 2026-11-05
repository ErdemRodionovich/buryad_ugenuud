const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const link = require('bare-link')

const projectRoot = path.resolve(__dirname, '..')
const appRoot = path.resolve(projectRoot, '..')
const bundlePath = path.join(projectRoot, 'src/worker.bundle.js')
const outputPath = path.join(projectRoot, 'worker-addons')
const hosts = [
  { name: 'android-arm64', abi: 'arm64-v8a' },
  { name: 'android-x64', abi: 'x86_64' }
]

function getLinkedAddons() {
  const bundle = require(bundlePath)
  const firstLineEnd = bundle.indexOf('\n')
  const metadataEnd = bundle.indexOf('\n', firstLineEnd + 1)

  if (firstLineEnd === -1 || metadataEnd === -1) {
    throw new Error('The Bare worker bundle has invalid metadata.')
  }

  const metadata = JSON.parse(bundle.slice(firstLineEnd + 1, metadataEnd))
  const addons = new Set()

  function collect(value) {
    if (typeof value === 'string') {
      if (value.startsWith('linked:') && value.endsWith('.so')) {
        addons.add(value.slice('linked:'.length))
      }
      return
    }

    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) collect(child)
    }
  }

  collect(metadata.resolutions)
  if (addons.size === 0) throw new Error('The worker bundle does not declare linked native addons.')
  return addons
}

async function main() {
  const addons = getLinkedAddons()
  const temporaryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'buryad-worker-addons-'))

  try {
    for await (const _ of link(appRoot, {
      hosts: hosts.map(({ name }) => name),
      out: temporaryPath
    })) {
      // bare-link writes each native addon to the temporary output directory.
    }

    fs.rmSync(outputPath, { recursive: true, force: true })
    for (const { abi } of hosts) {
      const sourceDirectory = path.join(temporaryPath, abi)
      const outputDirectory = path.join(outputPath, abi)
      fs.mkdirSync(outputDirectory, { recursive: true })
      const linkedLibraries = fs.readdirSync(sourceDirectory).filter((name) => name.endsWith('.so'))

      for (const addon of addons) {
        if (!linkedLibraries.includes(addon)) {
          throw new Error(`Missing ${addon} for ${abi}; it is required by the worker bundle.`)
        }
      }

      for (const library of linkedLibraries) {
        fs.copyFileSync(path.join(sourceDirectory, library), path.join(outputDirectory, library))
      }
    }

    console.log(
      `Linked ${addons.size} worker addons and their native dependencies for ${hosts
        .map(({ abi }) => abi)
        .join(', ')}.`
    )
  } finally {
    fs.rmSync(temporaryPath, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error('Failed to link native addons for the Bare worker:', error)
  process.exitCode = 1
})
