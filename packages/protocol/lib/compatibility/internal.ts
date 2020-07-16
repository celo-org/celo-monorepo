import { Contract as ZContract } from '@openzeppelin/upgrades'
const Web3 = require('web3')
const web3 = new Web3(null)

// getStorageLayout needs an oz-sdk Contract class instance. This class is a
// subclass of Contract from web3-eth-contract, with an added .schema member and
// several methods.
//
// Couldn't find an easy way of getting one just from contract artifacts. But
// for getStorageLayout we really only need .schema.ast and .schema.contractName.
export function makeZContract(artifact: any): ZContract {
  const web3Contract = new web3.eth.Contract(artifact.abi)
  // @ts-ignore
  const contract = web3Contract as Contract
  // @ts-ignore
  contract.schema = {}
  contract.schema.ast = artifact.ast
  contract.schema.contractName = artifact.contractName
  contract.schema.deployedBytecode = artifact.deployedBytecode
  return contract
}