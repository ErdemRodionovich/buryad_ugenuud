const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig: getExpoConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')
const config = mergeConfig(getDefaultConfig(projectRoot), getExpoConfig(projectRoot))

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules')
]

module.exports = config
