import {
  getDeployedProxiedContract,
  submitMultiSigTransaction,
} from '@celo/protocol/lib/web3-utils'
import * as prompts from 'prompts'
import { MultiSigInstance, ProxyInstance } from 'types'

const Artifactor = require('truffle-artifactor')

const argv = require('minimist')(process.argv.slice(2))

const contractsDir = argv.build_directory + '/contracts'

const truffle = require('@celo/protocol/truffle-config.js')
const network = truffle.networks[argv.network]

const artifactor = new Artifactor(contractsDir)

let _multiSig: MultiSigInstance

async function multiSig() {
  if (!_multiSig) {
    _multiSig = await getDeployedProxiedContract<MultiSigInstance>('MultiSig', artifacts)
  }

  return _multiSig
}

// Returns an array of [Contract, Proxy] pairs for contracts that have a corresponding proxy
function getProxiedContracts() {
  console.info(argv)

  const names = argv._.slice(2)

  return names.map((contractName: string) => {
    // tslint:disable-next-line:no-console
    console.log('Reading artifact for', contractName)
    return [
      artifacts.require(contractName) as Truffle.Contract<any>,
      artifacts.require(contractName + 'Proxy') as Truffle.Contract<ProxyInstance>,
    ]
  })
}

async function updateArtifact(Contract: Truffle.Contract<any>, contract: Truffle.ContractInstance) {
  // @ts-ignore
  const artifact = Contract._json

  artifact.networks[network.network_id] = {
    address: contract.address,
    // @ts-ignore
    transactionHash: contract.transactionHash,
  }

  await artifactor.save(artifact)
}

async function setImplementation(contract: Truffle.ContractInstance, proxy: ProxyInstance) {
  // @ts-ignore
  await submitMultiSigTransaction(
    await multiSig(),
    proxy.address,
    // @ts-ignore
    proxy.contract._setImplementation.getData(contract.address)
  )
}

async function upgradeContract(
  Contract: Truffle.Contract<any>,
  proxy: ProxyInstance
): Promise<any> {
  try {
    const contract = await Contract.new()
    if (argv['set-implementation']) {
      await setImplementation(contract, proxy)
    }
    await updateArtifact(Contract, contract)
    return {
      contract: Contract.contractName + 'Proxy',
      function: '_setImplementation',
      value: 0,
      args: [contract.address],
    }
  } catch (err) {
    console.error('Error', err)
  }
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const contractsToUpgrade = getProxiedContracts()
    const contractNames = contractsToUpgrade
      .map(([Contract, _Proxy]) => Contract.contractName)
      .join('\n')
    // tslint:disable-next-line:no-console
    console.log('The following contracts are going to be upgraded:')
    // tslint:disable-next-line:no-console
    console.log(contractNames)

    const response = await prompts({
      type: 'confirm',
      name: 'confirmation',
      message: 'Are you sure you want to upgrade these contracts? (y/n)',
    })

    if (!response.confirmation) {
      console.info('Aborting due to user response')
      process.exit(0)
    }

    const proposalList = await Promise.all(
      contractsToUpgrade.map(
        async ([Contract, Proxy]: [Truffle.Contract<any>, Truffle.Contract<ProxyInstance>]) => {
          // tslint:disable-next-line:no-console
          console.log('Updating', Contract.contractName)
          const proxy = await Proxy.deployed()
          return upgradeContract(Contract, proxy)
        }
      )
    )
    // tslint:disable-next-line:no-console
    console.log('Generated proposal')
    // tslint:disable-next-line:no-console
    console.log(JSON.stringify(proposalList, null, 2))

    callback()
  } catch (error) {
    callback(error)
  }
}
