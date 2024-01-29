import PACKAGE from '../abis/package.json'

if (countOfWeb3ContractExports() === 0) {
  console.error('No web3 contracts exported from package')
  process.exit(1)
}

if (countOfJSONExports() === 0) {
  console.error('No JSON ABIS were exported from package')
  process.exit(1)
}

console.info('Package exports are valid!')
process.exit(0)

// utils
function countOfWeb3ContractExports() {
  return Object.keys(PACKAGE.exports).filter((key) => {
    return key.startsWith('./web3')
  }).length
}

function countOfJSONExports() {
  return Object.keys(PACKAGE.exports).filter((key) => {
    return key.endsWith('.json')
  }).length
}
