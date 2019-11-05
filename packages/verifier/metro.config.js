const path = require('path')
const nodeLibs = require('node-libs-react-native')
const blacklist = require('metro-config/src/defaults/blacklist')
const metroDefaults = require('metro-config/src/defaults/defaults')
const escapeStringRegexp = require('escape-string-regexp')

const cwd = path.resolve(__dirname)
const root = path.resolve(cwd, '../..')
const escapedRoot = escapeStringRegexp(root)
const celoRegex = new RegExp(`${escapedRoot}\/packages\/(?!verifier|utils|react-components).*`)
const nestedRnRegex = new RegExp(`.*\/node_modules\/.*\/node_modules\/react-native\/.*`)
const componentsRnRegex = new RegExp(`.*react-components\/node_modules\/(react-native)\/.*`)
const blacklistRE = blacklist([celoRegex, nestedRnRegex, componentsRnRegex])

module.exports = {
  resolver: {
    blacklistRE,
    extraNodeModules: {
      ...nodeLibs,
    },
    sourceEtxs: metroDefaults.sourceEtxs,
  },

  watchFolders: [root],
}
