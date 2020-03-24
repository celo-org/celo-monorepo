const path = require('path')
const nodeLibs = require('node-libs-react-native')
const blacklist = require('metro-config/src/defaults/blacklist')
const escapeStringRegexp = require('escape-string-regexp')
const isE2E = process.env.CELO_TEST_CONFIG === 'e2e'

const cwd = path.resolve(__dirname)
const root = path.resolve(cwd, '../..')
const escapedRoot = escapeStringRegexp(root)
const celoRegex = new RegExp(
  `${escapedRoot}\/packages\/(?!mobile|utils|contractkit|react-components).*`
)
const nestedRnRegex = new RegExp(`.*\/node_modules\/.*\/node_modules\/(react-native)\/.*`)
const componentsRnRegex = new RegExp(`.*react-components\/node_modules\/(react-native)\/.*`)
const blist = [celoRegex, nestedRnRegex, componentsRnRegex]
const defaultSourceExts = require('metro-config/src/defaults/defaults').sourceExts

module.exports = {
  resolver: {
    blacklistRE: blacklist(
      isE2E ? blist : blist.concat([RegExp(`${escapedRoot}\/packages\/mobile\/e2e\/mocks/.*`)])
    ),
    extraNodeModules: {
      ...nodeLibs,
      'crypto-js': path.resolve(cwd, 'node_modules/crypto-js'),
      fs: require.resolve('react-native-fs'),
      'isomorphic-fetch': require.resolve('cross-fetch'),
      net: require.resolve('react-native-tcp'),
      vm: require.resolve('vm-browserify'),
    },
    sourceExts: isE2E ? ['e2e.ts', 'e2e.js'].concat(defaultSourceExts) : defaultSourceExts,
  },
  watchFolders: [root],
}
