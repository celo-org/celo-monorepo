import { Address } from '@celo/connect'
import { setAndInitializeImplementation } from '@celo/protocol/lib/proxy-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { createInterfaceAdapter } from '@truffle/interface-adapter'
import path from 'path'
import prompts from 'prompts'
import { ProxyContract, ProxyInstance, RegistryInstance } from 'types'
import Web3 from 'web3'
import { ContractPackage } from '../contractPackages'
import { ArtifactsSingleton } from './artifactsSingleton'

const truffleContract = require('@truffle/contract');

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
  // which is the case for GasPriceMinimum
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

export const getProxiedContract = async (contractName: string, contractPackage: ContractPackage) => {
  const artifactsObject = ArtifactsSingleton.getInstance(contractPackage, artifacts)
  /* eslint-disable-next-line */
  return await getDeployedProxiedContract(contractName, artifactsObject)
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


export const makeTruffleContractForMigrationWithoutSingleton = (contractName: string, network: any, contractPath: string, web3: Web3, buildDir?:string) => {
  const buildDirPath = buildDir ? `../${buildDir}` : "../build/"
  const artifact = require(`${path.join(__dirname, buildDirPath)}/contracts-${contractPath}/${contractName}.json`)
  const Contract = truffleContract({
    contractName: artifact.contractName,
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
  const singleton = ArtifactsSingleton.getInstance(contractPath)
  if (singleton.contains(contractName)) {
    return singleton.require(contractName)
  }

  const network = ArtifactsSingleton.getNetwork()
  const Contract = makeTruffleContractForMigrationWithoutSingleton(contractName, network, contractPath.name, web3)
  singleton.addArtifact(contractName, Contract)
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
