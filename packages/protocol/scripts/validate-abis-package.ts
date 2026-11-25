import PACKAGE from '../abis/package.json'

if (countOfModuleExports() === 0) {
  console.error('No ABI modules were exported from package')
  process.exit(1)
}

if (countOfJSONExports() === 0) {
  console.error('No JSON ABIS were exported from package')
  process.exit(1)
}

console.info('Package exports are valid!')
process.exit(0)

// utils
// The per-contract ABI modules (e.g. `accountsABI` from '@celo/abis/Accounts') that
// viem and wagmi consume, each built for both module systems.
function countOfModuleExports() {
  return Object.entries(PACKAGE.exports).filter(([key, value]) => {
    const target = value as { import?: string; require?: string }
    return key !== '.' && !key.endsWith('.json') && !!target.import && !!target.require
  }).length
}

function countOfJSONExports() {
  return Object.keys(PACKAGE.exports).filter((key) => {
    return key.endsWith('.json')
  }).length
}
