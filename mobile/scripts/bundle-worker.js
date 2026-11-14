const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { withWorkerDependencies } = require('./worker-dependencies')

const projectRoot = path.resolve(__dirname, '..')
const barePack = path.join(projectRoot, 'node_modules/bare-pack/bin.js')
const outputPath = path.join(projectRoot, 'src/worker.bundle.js')
const hosts = [
  'android-arm64',
  'android-x64',
  'ios-arm64',
  'ios-arm64-simulator',
  'ios-x64-simulator'
]

withWorkerDependencies((workerRoot) => {
  const args = hosts.flatMap((host) => ['--host', host])
  args.push('--linked', '--out', outputPath, path.join(workerRoot, 'index.js'))

  const result = spawnSync(process.execPath, [barePack, ...args], {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exitCode = result.status ?? 1
}).catch((error) => {
  console.error('Failed to bundle the current Buryad worker:', error)
  process.exitCode = 1
})
