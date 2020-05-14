import {
  getDeployedProxiedContract,
  submitMultiSigTransaction,
} from '@celo/protocol/lib/web3-utils'
import * as prompts from 'prompts'
import { MultiSigInstance, ProxyInstance } from 'types'

const Artifactor = require('truffle-artifactor')
import fs = require('fs')
const VM = require('ethereumjs-vm').default
const BN = require('bn.js')

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

  let names = []
  if (argv.contract) {
    names.push(argv.contract)
  } else {
    names = fs
      .readdirSync(contractsDir)
      .filter((filename: string) => /\w+Proxy.json$/.test(filename))
      .map(contractNameFromProxyFilename)
  }

  return names.map((contractName: string) => {
    // tslint:disable-next-line:no-console
    console.log('Reading artifact', contractName)
    return [
      artifacts.require(contractName) as Truffle.Contract<any>,
      artifacts.require(contractName + 'Proxy') as Truffle.Contract<ProxyInstance>,
    ]
  })
}

function fill(a: string) {
  let res = '__' + a
  while (res.length < 40) {
    res = res + '_'
  }
  return new RegExp(res, 'g')
}

function linkBytecode(Contract: Truffle.Contract<any>) {
  // @ts-ignore
  const artifact = Contract._json
  const data = artifact.networks[network.network_id].links
  let code: string = artifact.bytecode.slice(2)
  for (const a of Object.keys(data)) {
    // console.log("link", a, code.match(fill(a)))
    code = code.replace(fill(a), data[a].slice(2))
  }
  // console.log("linked", code)
  return code.toLowerCase()
}

/*
 * When deploying a smart contract to an Ethereum network, one sends EVM
 * bytecode that, when run, returns the bytecode that will actually live on the
 * blockchain. Build artifacts store that initial bytecode.
 * This function returns the bytecode that would be stored on the blockchain if
 * Contract were deployed.
 */
async function getCompiledBytecode(Contract: Truffle.Contract<any>): Promise<string> {
  const res = await vm.runCode({
    code: Buffer.from(linkBytecode(Contract), 'hex'),
    gasLimit: new BN('0xfffffffff'),
  })
  return res.returnValue.toString('hex')
}

async function getImplementationBytecode(proxy: ProxyInstance) {
  const implementationAddress = await proxy._getImplementation()
  const res = await web3.eth.getCode(implementationAddress)
  return res.slice(2)
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
  // const impl = await getImplementationBytecode(proxy)
  // console.log("comparing", Contract.contractName, impl.slice(2).length, linkDeployedBytecode(Contract).length)
  // console.log("comparing", Contract.contractName,
  // stripMetadata(impl.slice(2)) === stripMetadata(linkDeployedBytecode(Contract)))
  const implementationBytecode = stripMetadata(await getImplementationBytecode(proxy))
  const compiledBytecode = stripMetadata(await getCompiledBytecode(Contract))
  const res = implementationBytecode !== compiledBytecode
  if (!res) {
    console.info('Not changed', Contract.contractName)
  }
  return res
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
    const proxiedContracts = getProxiedContracts()
    const contractNeedsUpgrade = await Promise.all(
      proxiedContracts.map(
        async ([Contract, Proxy]: [Truffle.Contract<any>, Truffle.Contract<ProxyInstance>]) => {
          try {
            const proxy = await Proxy.deployed()
            const res = await needsUpgrade(Contract, proxy)
            return res
          } catch (err) {
            console.error('Not upgrading', Contract.contractName, err)
            return false
          }
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

      const lst = await Promise.all(
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
      console.log(JSON.stringify(lst, null, 2))
    } else {
      // tslint:disable-next-line:no-console
      console.log('All contracts up to date')
    }

    callback()
  } catch (error) {
    callback(error)
  }
}
