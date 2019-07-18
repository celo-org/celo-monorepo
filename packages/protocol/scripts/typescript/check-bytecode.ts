/* tslint:disable:no-console */
import * as fs from 'fs'
import { concreteContracts } from '../../lib/concrete-contracts'

console.log('CONCRETE CONTRACTS')
console.log('====================')
console.log(concreteContracts)
console.log('====================')

const { build_directory } = require('minimist')(process.argv.slice(2))

console.log(`Using build directory ${build_directory}`)

function getArtifact(contractName: string) {
  const file = fs.readFileSync(`${build_directory}/contracts/${contractName}.json`).toString()
  return JSON.parse(file)
}

function hasEmptyBytecode(contract: any) {
  return contract.bytecode === '0x'
}

const contractsWithEmptyBytecode = concreteContracts.map(getArtifact).filter(hasEmptyBytecode)

if (contractsWithEmptyBytecode.length > 0) {
  contractsWithEmptyBytecode.forEach((contract) => {
    console.log(
      `ERROR: ${
        contract.contractName
      } has empty bytecode. Maybe you forgot to fully implement an interface?`
    )
  })

  process.exit(1)
}
