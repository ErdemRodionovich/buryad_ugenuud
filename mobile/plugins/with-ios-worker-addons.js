const fs = require('node:fs')
const path = require('node:path')
const link = require('bare-link')
const { withDangerousMod, withPodfile } = require('@expo/config-plugins')
const { withWorkerDependencies } = require('../scripts/worker-dependencies')

const workerAddonHosts = ['ios-arm64', 'ios-arm64-simulator', 'ios-x64-simulator']
const podDeclaration = "  pod 'BuryadWorkerAddons', :path => '../worker-addons-ios'"

function withIosWorkerAddons(config) {
  config = withPodfile(config, (modConfig) => {
    let contents = modConfig.modResults.contents
    if (!contents.includes(podDeclaration)) {
      const target = contents.match(/^target\s+['"][^'"]+['"]\s+do\s*$/m)
      if (!target) throw new Error('Could not find the iOS app target in the Podfile.')
      contents = contents.replace(target[0], `${target[0]}\n${podDeclaration}`)
    }
    modConfig.modResults.contents = contents
    return modConfig
  })

  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const { projectRoot } = modConfig.modRequest
      const outputPath = path.join(projectRoot, 'worker-addons-ios', 'Frameworks')

      fs.rmSync(outputPath, { recursive: true, force: true })
      fs.mkdirSync(outputPath, { recursive: true })

      await withWorkerDependencies(async (workerRoot) => {
        let linkedFrameworkCount = 0
        for await (const resource of link(workerRoot, {
          hosts: workerAddonHosts,
          out: outputPath
        })) {
          if (resource.endsWith('.xcframework')) linkedFrameworkCount += 1
        }

        if (linkedFrameworkCount === 0) {
          throw new Error('Bare Link did not generate any iOS worker addon frameworks.')
        }
      })

      return modConfig
    }
  ])
}

module.exports = withIosWorkerAddons
