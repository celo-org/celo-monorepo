const path = require('path')
const nodeLibs = require('node-libs-react-native')
const blacklist = require('metro-config/src/defaults/blacklist')
const metroDefaults = require('metro-config/src/defaults/defaults')
const escapeStringRegexp = require('escape-string-regexp')

const cwd = path.resolve(__dirname)
const root = path.resolve(cwd, '../..')
const escapedRoot = escapeStringRegexp(root)
const rnRegex = new RegExp(`${escapedRoot}\/node_modules\/react-native\/.*`)
const celoRegex = new RegExp(`${escapedRoot}\/packages\/(?!verifier|utils|react-components).*`)
const nestedRnRegex = new RegExp(`.*\/node_modules\/.*\/node_modules\/react-native\/.*`)
const componentsRnRegex = new RegExp(`.*react-components\/node_modules\/(react-native)\/.*`)
const blacklistRE = blacklist([rnRegex, celoRegex, nestedRnRegex, componentsRnRegex])

module.exports = {
  resolver: {
    blacklistRE,
    extraNodeModules: {
      ...nodeLibs,
      'react-native': path.resolve(cwd, 'node_modules/react-native'),
      'react-native-fs': path.resolve(cwd, 'node_modules/react-native-fs'),
      'react-native-svg': path.resolve(cwd, 'node_modules/react-native-svg'),
    },
    sourceEtxs: metroDefaults.sourceEtxs,
  },

  watchFolders: [root],
}
