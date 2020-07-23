import {
  getDeployedProxiedContract,
  submitMultiSigTransaction,
} from '@celo/protocol/lib/web3-utils'
import * as prompts from 'prompts'
import { MultiSigInstance, ProxyInstance } from 'types'

const Artifactor = require('truffle-artifactor')
import fs = require('fs')
const VM = require('ethereumjs-vm')

const vm = new VM()

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
  const contractNameFromProxyFilename = (proxyFilename: string) => {
    return proxyFilename.slice(0, -'Proxy.json'.length)
  }

  return fs
    .readdirSync(contractsDir)
    .filter((filename: string) => /\w+Proxy.json$/.test(filename))
    .map(contractNameFromProxyFilename)
    .map((contractName: string) => [
      artifacts.require(contractName) as Truffle.Contract<any>,
      artifacts.require(contractName + 'Proxy') as Truffle.Contract<ProxyInstance>,
    ])
}

/*
 * When deploying a smart contract to an Ethereum network, one sends EVM
 * bytecode that, when run, returns the bytecode that will actually live on the
 * blockchain. Build artifacts store that initial bytecode.
 * This function returns the bytecode that would be stored on the blockchain if
 * Contract were deployed.
 */
function getCompiledBytecode(Contract: Truffle.Contract<any>): Promise<string> {
  return new Promise((resolve, reject) => {
    vm.runCode(
      {
        // @ts-ignore
        code: Buffer.from(Contract.bytecode.slice(2), 'hex'),
        gasLimit: Buffer.from('fffffffff', 'hex'),
      },
      (err: any, results: any) => {
        if (err) {
          reject(err)
        } else {
          resolve('0x' + results.return.toString('hex'))
        }
      }
    )
  })
}

async function getImplementationBytecode(proxy: ProxyInstance) {
  const implementationAddress = await proxy._getImplementation()
  return web3.eth.getCode(implementationAddress)
}

/*
 * The Solidity compiler appends a Swarm Hash of compilation metadata to the end
 * of bytecode. We find this hash based on the specification here:
 * https://solidity.readthedocs.io/en/develop/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode
 */
function stripMetadata(bytecode: string) {
  try {
    // TODO: use proper CBOR parser
    const [, bytes] = bytecode.match(/^(.*)a165627a7a72305820.*0029$/i)
    return bytes
  } catch (e) {
    throw new Error('Bytecode metadata not found.')
  }
}

async function needsUpgrade(Contract: Truffle.Contract<any>, proxy: ProxyInstance) {
  const implementationBytecode = stripMetadata(await getImplementationBytecode(proxy))
  const compiledBytecode = stripMetadata(await getCompiledBytecode(Contract))
  return implementationBytecode !== compiledBytecode
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

async function upgradeContract(Contract: Truffle.Contract<any>, proxy: ProxyInstance) {
  const contract = await Contract.new()
  await setImplementation(contract, proxy)
  await updateArtifact(Contract, contract)
}

module.exports = async (callback: (error?: any) => number) => {
  try {
    const proxiedContracts = getProxiedContracts()
    const contractNeedsUpgrade = await Promise.all(
      proxiedContracts.map(
        async ([Contract, Proxy]: [Truffle.Contract<any>, Truffle.Contract<ProxyInstance>]) => {
          const proxy = await Proxy.deployed()
          return needsUpgrade(Contract, proxy)
        }
      )
    )
    if (contractNeedsUpgrade.some((x) => x)) {
      const contractsToUpgrade = proxiedContracts.filter(
        ([_Contract, _Proxy], i) => contractNeedsUpgrade[i]
      )
      const contractNames = contractsToUpgrade
        .map(([Contract, _Proxy]) => Contract.contractName)
        .join('\n')
      // tslint:disable-next-line:no-console
      console.log('The following contracts need upgrading:')
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

      contractsToUpgrade.forEach(
        async ([Contract, Proxy]: [Truffle.Contract<any>, Truffle.Contract<ProxyInstance>]) => {
          // tslint:disable-next-line:no-console
          console.log('Updating', Contract.contractName)
          const proxy = await Proxy.deployed()
          await upgradeContract(Contract, proxy)
        }
      )
    } else {
      // tslint:disable-next-line:no-console
      console.log('All contracts up to date')
    }

    callback()
  } catch (error) {
    callback(error)
  }
}
