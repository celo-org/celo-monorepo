
// TODO(asa): Refactor and rename to 'deployment-utils.ts'
import { Address, CeloTxObject } from '@celo/connect'
import { setAndInitializeImplementation } from '@celo/protocol/lib/proxy-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { signTransaction } from '@celo/protocol/lib/signing-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { BuildArtifacts } from '@openzeppelin/upgrades'
import { createInterfaceAdapter } from '@truffle/interface-adapter'
import { BigNumber } from 'bignumber.js'
import path from 'path'
import prompts from 'prompts'
import { GoldTokenInstance, MultiSigInstance, OwnableInstance, ProxyContract, ProxyInstance, RegistryInstance } from 'types'
import { StableTokenInstance } from 'types/mento'
import Web3 from 'web3'
import { ContractPackage } from '../contractPackages'
import { ArtifactsSingleton } from './artifactsSingleton'


const truffleContract = require('@truffle/contract');


export async function sendTransactionWithPrivateKey<T>(
  web3: Web3,
  tx: CeloTxObject<T> | null,
  privateKey: string,
  txArgs: any
) {
  const address = privateKeyToAddress(privateKey)

  // Encode data and estimate gas or use default values for a transfer.
  let encodedTxData: string | undefined
  let estimatedGas = 21000 // Gas cost of a basic transfer.

  if (tx !== null) {
    encodedTxData = tx.encodeABI()
    estimatedGas = await tx.estimateGas({
      ...txArgs,
      from: address,
    })
  }
  const signedTx = await signTransaction(
    web3,
    {
      ...txArgs,
      data: encodedTxData,
      from: address,
      // make sure to use enough gas but dont overspend
      // or we will run into "block gas limit exceeded" errors
      gas: estimatedGas * 2,
    },
    privateKey
  )

  const rawTransaction = signedTx.raw
  return web3.eth.sendSignedTransaction(rawTransaction)
}

export async function convertFromContractDecimals(
  value: BigNumber | number,
  contract: GoldTokenInstance | StableTokenInstance
) {
  const decimals = (await contract.decimals()).toNumber()
  const one = new BigNumber(10).pow(decimals)
  return new BigNumber(value).div(one).valueOf()
}

interface TokenInstance {
  decimals: () => Promise<BigNumber>
}

export async function convertToContractDecimalsBN(
  value: number | BigNumber,
  contract: TokenInstance
) {
  const decimals = (await contract.decimals()).toNumber()
  const one = new BigNumber(10).pow(decimals)
  return one.times(value)
}

/**
 * @deprecated We should use BigNumber whenever possible. use convertToContractDecimalsBN()
 */
export async function convertToContractDecimals(
  value: number | BigNumber,
  contract: TokenInstance
) {
  const bnNumber = await convertToContractDecimalsBN(value, contract)
  return bnNumber.toNumber()
}

export async function getERC20TokenBalance(
  account: string,
  contract: GoldTokenInstance | StableTokenInstance
) {
  return convertFromContractDecimals(await contract.balanceOf(account), contract)
}

export interface IncrementBalancesObject {
  address: string
  value: number | BigNumber
}

export function parseExchangeRate(exchangeRate: BigNumber[]) {
  return {
    makerAmount: exchangeRate[0].toNumber(),
    takerAmount: exchangeRate[1].toNumber(),
  }
}

export function parseMultiSigTransaction(transaction: [string, BigNumber, string, boolean]) {
  return {
    destination: transaction[0],
    value: transaction[1].toNumber(),
    data: transaction[2],
    executed: transaction[3],
  }
}

export function parseStableTokenParams(params: BigNumber[]) {
  return {
    rebasePeriod: params[0].toNumber(),
    lastRebase: params[1].toNumber(),
    stableWindow: {
      min: {
        makerAmount: params[2].toNumber(),
        takerAmount: params[3].toNumber(),
      },
      max: {
        makerAmount: params[4].toNumber(),
        takerAmount: params[5].toNumber(),
      },
    },
  }
}

export function randomUint256() {
  const maxUint256 = new BigNumber(2).pow(256)
  return BigNumber.random()
    .times(maxUint256)
    .integerValue()
    .valueOf()
}

export function checkFunctionArgsLength(args: any[], abi: any) {
  if (args.length !== abi.inputs.length) {
    throw new Error(`Incorrect number of arguments to Solidity function: ${abi.name}`)
  }
}

export async function setInitialProxyImplementation<
  ContractInstance extends Truffle.ContractInstance
>(web3: Web3, artifacts: any, contractName: string, contractPackage?: ContractPackage, ...args: any[]): Promise<ContractInstance> {

  const wrappedArtifacts = ArtifactsSingleton.getInstance(contractPackage, artifacts)
  const Contract = wrappedArtifacts.require(contractName)

  // getProxy function supports the case the proxy is in a different package
  // which is the case for GasPriceMimimum
  const ContractProxy = wrappedArtifacts.getProxy(contractName, artifacts)

  await Contract.detectNetwork()
  await ContractProxy.detectNetwork()
  const implementation: ContractInstance = await Contract.deployed()
  const proxy: ProxyInstance = await ContractProxy.deployed()
  await _setInitialProxyImplementation(web3, implementation, proxy, contractName, { from: null, value: null }, ...args)
  return Contract.at(proxy.address) as ContractInstance
}

export async function _setInitialProxyImplementation<
  ContractInstance extends Truffle.ContractInstance
>(
  web3: Web3,
  implementation: ContractInstance,
  proxy: ProxyInstance,
  contractName: string,
  txOptions: {
    from: Address,
    value: string,
  },
  ...args: any[]
) {
  const initializerAbi = (implementation as any).abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'initialize'
  )

  let receipt: any
  if (initializerAbi) {
    // TODO(Martin): check types, not just argument number
    checkFunctionArgsLength(args, initializerAbi)
    console.info(`  Setting initial ${contractName} implementation on proxy`)
    receipt = await setAndInitializeImplementation(web3, proxy, implementation.address, initializerAbi, txOptions, ...args)
  } else {
    if (txOptions.from != null) {
      receipt = await retryTx(proxy._setImplementation, [implementation.address, { from: txOptions.from }])
      if (txOptions.value != null) {
        await retryTx(web3.eth.sendTransaction, [{
          from: txOptions.from,
          to: proxy.address,
          value: txOptions.value,
        }])
      }
    } else {
      receipt = await retryTx(proxy._setImplementation, [implementation.address])
    }
  }
  return receipt.tx
}

export async function getDeployedProxiedContract<ContractInstance extends Truffle.ContractInstance>(
  contractName: string,
  customArtifacts: any
): Promise<ContractInstance> {

  const Contract: Truffle.Contract<ContractInstance> = customArtifacts.require(contractName)

  let Proxy: ProxyContract
  // this wrap avoids a lot of rewrite
  const overloadedArtifact = ArtifactsSingleton.wrap(customArtifacts)
  // if global artifacts are not defined we need to handle it
  const defaultArtifacts = typeof artifacts !== 'undefined' ? artifacts : undefined;
  Proxy = overloadedArtifact.getProxy(contractName, defaultArtifacts)
  const proxy: ProxyInstance = await Proxy.deployed()
  // @ts-ignore
  Contract.numberFormat = 'BigNumber'
  return Contract.at(proxy.address) as ContractInstance
}

/*
 * Abstracts away the overhead of a typical Proxy+Implementation contract deployment.
 *
 * Arguments:
 * - artifacts: the Resolver object provided by Truffle
 * - name: name of the contract to deploy
 * - args: array of arguments to the contract's initializer
 * - then: a callback that can perform additional migration operations after deployment
 *
 * The callback will be called with the deployed proxied contract, a web3
 * instance (derived from the provider of the deployer given by Truffle), and the
 * name of the network (as given by Truffle).
 *
 * Returns:
 * A function with a signature as expected to be exported from a Truffle
 * migration script.
 */
export function deploymentForCoreContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  then?: (contract: ContractInstance, web3: Web3, networkName: string) => void,
  artifactPath?: ContractPackage
) {
  return deploymentForContract(web3, artifacts, name, args, true, then, artifactPath);
}

export function deploymentForProxiedContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  then?: (contract: ContractInstance, web3: Web3, networkName: string) => void,
  artifactPath?: ContractPackage
) {
  return deploymentForContract(web3, artifacts, name, args, false, then, artifactPath);

}


export const makeTruffleContractForMigrationWithoutSingleton = (contractName: string, network: any, contractPath: string, web3: Web3) => {

  const artifact = require(`${path.join(__dirname, "..")}/build/contracts-${contractPath}/${contractName}.json`)
  const Contract = truffleContract({
    abi: artifact.abi,
    unlinked_binary: artifact.bytecode,
  })


  Contract.setProvider(web3.currentProvider)
  Contract.setNetwork(network.network_id)

  Contract.interfaceAdapter = createInterfaceAdapter({
    networkType: "ethereum",
    provider: web3.currentProvider
  })
  Contract.configureNetwork({ networkType: "ethereum", provider: web3.currentProvider })

  Contract.defaults({ from: network.from, gas: network.gas })

  return Contract
}


export const makeTruffleContractForMigration = (contractName: string, contractPath: ContractPackage, web3: Web3) => {
  const network = ArtifactsSingleton.getNetwork()
  const Contract = makeTruffleContractForMigrationWithoutSingleton(contractName, network, contractPath.name, web3)
  ArtifactsSingleton.getInstance(contractPath).addArtifact(contractName, Contract)
  return Contract
}

export function deploymentForContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  registerAddress: boolean,
  then?: (contract: ContractInstance, web3: Web3, networkName: string, proxy?: ProxyInstance) => void,
  artifactPath?: ContractPackage
) {

  console.info("-> Started deployment for", name)
  let Contract
  let ContractProxy
  if (artifactPath) {
    Contract = makeTruffleContractForMigration(name, artifactPath, web3)

    // This supports the case the proxy is in a different package
    if (artifactPath.proxiesPath) {
      if (artifactPath.proxiesPath == "/") {
        ContractProxy = artifacts.require(name + 'Proxy')
      } else {
        throw "Loading proxies for custom path not supported"
      }
    } else {
      ContractProxy = makeTruffleContractForMigration(name + 'Proxy', artifactPath, web3)
    }
  } else {
    Contract = artifacts.require(name)
    ContractProxy = artifacts.require(name + 'Proxy')
  }

  return (deployer: any, networkName: string, _accounts: string[]) => {
    console.info("\n-> Deploying", name)

    deployer.deploy(ContractProxy)
    deployer.deploy(Contract, { gas: 5000000 })

    deployer.then(async () => {
      const proxy: ProxyInstance = await ContractProxy.deployed()
      await proxy._transferOwnership(ContractProxy.defaults().from)
      const proxiedContract: ContractInstance = await setInitialProxyImplementation<
        ContractInstance
      >(web3, artifacts, name, artifactPath, ...(await args(networkName)))
      if (registerAddress) {
        const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
        await registry.setAddressFor(name, proxiedContract.address)
      }
      if (then) {
        await then(proxiedContract, web3, networkName, ContractProxy)
      }
    })
  }
}

export async function submitMultiSigTransaction(
  multiSig: MultiSigInstance,
  address: string,
  data: string,
  value: number | BigNumber = 0
) {
  const txId = await multiSig.submitTransaction.call(address, value, data)
  // @ts-ignore Typechain generating wrong type for data argument
  // TODO(asa): Fix this
  await multiSig.submitTransaction(address, value, data)
  const txExecuted = (await multiSig.transactions(txId))[3]
  if (!txExecuted) {
    throw Error('Unable to execute MultiSig transaction')
  }
  return txId
}

export async function transferOwnershipOfProxy(
  contractName: string,
  owner: string,
  customArtifacts: any
) {
  const Proxy = ArtifactsSingleton.wrap(customArtifacts).getProxy(contractName, artifacts)
  const proxy: ProxyInstance = await Proxy.deployed()
  await proxy._transferOwnership(owner)
}

export async function transferOwnershipOfProxyAndImplementation<
  ContractInstance extends OwnableInstance
>(contractName: string, owner: string, artifacts: any) {
  console.info(`  Transferring ownership of ${contractName} and its Proxy to ${owner}`)
  const contract: ContractInstance = await getDeployedProxiedContract<ContractInstance>(
    contractName,
    artifacts
  )
  await contract.transferOwnership(owner)
  await transferOwnershipOfProxy(contractName, owner, artifacts)
}


/*
* Builds and returns mapping of function names to selectors.
* Each function name maps to an array of selectors to account for overloading.
*/
export function getFunctionSelectorsForContractProxy(contract: any, proxy: any, web3: any) {
  const selectors: { [index: string]: string[] } = {}
  proxy.abi
    .concat(contract.abi)
    .filter((abiEntry: any) => abiEntry.type === 'function')
    .forEach((func: any) => {
      if (typeof selectors[func.name] === 'undefined') {
        selectors[func.name] = []
      }
      if (typeof func.signature === 'undefined') {
        selectors[func.name].push(web3.eth.abi.encodeFunctionSignature(func))
      } else {
        selectors[func.name].push(func.signature)
      }
    })
  return selectors
}


/*
* Builds and returns mapping of function names to selectors.
* Each function name maps to an array of selectors to account for overloading.
*/
export function getFunctionSelectorsForContract(contract: any, contractName: string, customArtifacts: Truffle.Artifacts) {
  const selectors: { [index: string]: string[] } = {}
  let proxy: any = customArtifacts.require(contractName + 'Proxy')
  if (proxy == null) {
    const defaultArtifacts = typeof artifacts !== 'undefined' ? artifacts : undefined;
    proxy = defaultArtifacts != null ? defaultArtifacts.require(contractName + 'Proxy') : proxy;
  }
  proxy.abi
    .concat(contract.abi)
    .filter((abiEntry: any) => abiEntry.type === 'function')
    .forEach((func: any) => {
      if (typeof selectors[func.name] === 'undefined') {
        selectors[func.name] = []
      }
      if (typeof func.signature === 'undefined') {
        selectors[func.name].push(web3.eth.abi.encodeFunctionSignature(func))
      } else {
        selectors[func.name].push(func.signature)
      }
    })
  return selectors
}

// TODO: change to checkInheritance and use baseContracts field instead of importDirectives
export function checkImports(baseContractName: string, derivativeContractArtifact: any, artifacts: any) {
  const isImport = (astNode: any) => astNode.nodeType === 'ImportDirective'
  const imports: any[] = derivativeContractArtifact.ast.nodes.filter((astNode: any) => isImport(astNode))
  while (imports.length) { // BFS
    const importedContractName = (imports.pop().file as string).split('/').pop().split('.')[0]
    if (importedContractName === baseContractName) {
      return true
    }
    const importedContractArtifact = artifacts instanceof BuildArtifacts ?
      artifacts.getArtifactByName(importedContractName) :
      artifacts.require(importedContractName)
    imports.unshift(...importedContractArtifact.ast.nodes.filter((astNode: any) => isImport(astNode)))
  }
  return false
}

export async function retryTx(fn: any, args: any[]) {
  while (true) {
    try {
      const rvalue = await fn(...args)
      return rvalue
    } catch (e) {
      console.error(e)
      // @ts-ignore
      const { confirmation } = await prompts({
        type: 'confirm',
        name: 'confirmation',
        // @ts-ignore: typings incorrectly only accept string.
        initial: true,
        message: 'Error while sending tx. Try again?',
      })
      if (!confirmation) {
        throw e
      }
    }
  }
}
