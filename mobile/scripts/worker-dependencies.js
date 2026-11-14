const fs = require('node:fs')
const path = require('node:path')

const appRoot = path.resolve(__dirname, '../..')
const workerRoot = path.resolve(appRoot, '../worker')
const appNodeModules = path.join(appRoot, 'node_modules')
const workerNodeModules = path.join(workerRoot, 'node_modules')

async function withWorkerDependencies(callback) {
  if (!fs.existsSync(path.join(workerRoot, 'package.json'))) {
    throw new Error(`The sibling worker repository was not found at ${workerRoot}.`)
  }
  if (!fs.existsSync(appNodeModules)) {
    throw new Error('Install the app dependencies in the parent app/ directory first.')
  }

  let createdLink = false
  if (!fs.existsSync(workerNodeModules)) {
    fs.symlinkSync(appNodeModules, workerNodeModules, 'junction')
    createdLink = true
  }

  try {
    return await callback(workerRoot)
  } finally {
    if (createdLink) fs.unlinkSync(workerNodeModules)
  }
}

module.exports = { appRoot, withWorkerDependencies }
