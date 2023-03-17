/* tslint:disable:no-console */
// TODO(asa): Refactor and rename to 'deployment-utils.ts'
import { Address, CeloTxObject } from '@celo/connect'
import { Artifact } from '@celo/protocol/lib/compatibility/internal' // maybe is not truffle, it's a OZ
import { setAndInitializeImplementation } from '@celo/protocol/lib/proxy-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { signTransaction } from '@celo/protocol/lib/signing-utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { BuildArtifacts } from '@openzeppelin/upgrades'
import { BigNumber } from 'bignumber.js'
import prompts from 'prompts'
import { EscrowInstance, GoldTokenInstance, MultiSigInstance, OwnableInstance, ProxyContract, ProxyInstance, RegistryInstance } from 'types'
import { StableTokenInstance } from 'types/mento'
import Web3 from 'web3'
import { MySingleton } from '../migrations/singletonArtifacts'

// import truffleContract = require('truffle-contract')
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

  const signedTx: any = await signTransaction(
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

  const rawTransaction = signedTx.rawTransaction.toString('hex')
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
>(web3: Web3, artifacts: any, contractName: string, deployedContract?:any, deployedProxy?:any, ...args: any[]): Promise<ContractInstance> {
  console.log("Made it here1")
  let Contract, ContractProxy
  if (deployedContract){
    Contract = deployedContract
    ContractProxy = deployedProxy
    MySingleton.getInstance().addArtifact(contractName, Contract) // Add a key to avoid colition?
    MySingleton.getInstance().addArtifact(contractName + 'Proxy', ContractProxy) // Add a key to avoid colition?
    // Contract = makeTruffleContract(require(`../build/${artifactPath}/${contractName}.json`), web3)
    // ContractProxy = makeTruffleContract(require(`../build/${artifactPath}/${contractName + 'Proxy'}.json`), web3)
  } else {
    Contract = artifacts.require(contractName)
    ContractProxy = artifacts.require(contractName + 'Proxy')
  }



  await Contract.detectNetwork()
  await ContractProxy.detectNetwork()
  
  console.log("artifacts ok1")

  console.log("network id", await web3.eth.net.getId())
  console.log("networks:", Contract.networks)
  console.log("network type:", Contract.networkType)
  const implementation: ContractInstance = await Contract.deployed()
  console.log(11)
  const proxy: ProxyInstance = await ContractProxy.deployed()
  console.log(12)
  await _setInitialProxyImplementation(web3, implementation, proxy, contractName, { from: null, value: null }, ...args)
  console.log(13)
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
    console.log(`  Setting initial ${contractName} implementation on proxy`)
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


// export async function getDeployedProxiedContractExternal<ContractInstance extends Truffle.ContractInstance>(
//   Contract: any,

//   artifacts: any
// ): Promise<ContractInstance> {
//   const Proxy: ProxyContract = artifacts.require(contractName + 'Proxy')
//   const Contract: Truffle.Contract<ContractInstance> = artifacts.require(contractName)
//   const proxy: ProxyInstance = await Proxy.deployed()
//   // @ts-ignore
//   Contract.numberFormat = 'BigNumber'
//   return Contract.at(proxy.address) as ContractInstance
// }

export async function getDeployedProxiedContract<ContractInstance extends Truffle.ContractInstance>(
  contractName: string,
  artifacts: any
): Promise<ContractInstance> {
  const Proxy: ProxyContract = artifacts.require(contractName + 'Proxy')
  const Contract: Truffle.Contract<ContractInstance> = artifacts.require(contractName)
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
  artifactPath?: string
) {
  return deploymentForContract(web3, artifacts, name, args, true, then, artifactPath);
}

export function deploymentForProxiedContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  then?: (contract: ContractInstance, web3: Web3, networkName: string, proxy?: ProxyInstance) => void,
  artifactPath?: string
) {
  return deploymentForContract(web3, artifacts, name, args, false, then, artifactPath);

}



export const makeTruffleContract = (artifact: Artifact, web3: Web3) => {
  const Contract = truffleContract({
    abi: artifact.abi,
    unlinked_binary: artifact.bytecode,
  })

  // https://ethereum.stackexchange.com/questions/51240/error-deploying-using-truffle-contracts-cannot-read-property-apply-of-undefin
  // if (typeof Contract.currentProvider.sendAsync !== "function") {
  //   Contract.currentProvider.sendAsync = function() {
  //     return Contract.currentProvider.send.apply(
  //       Contract.currentProvider,
  //           arguments
  //     );
  //   };
  // }
  


  const {createInterfaceAdapter}= require("@truffle/interface-adapter")
  console.log("Provider ")
  // Contract.web3 = web3
  Contract.setProvider(web3.currentProvider)
  Contract.setNetwork(1101)
  // Contract.setNetwork("development")
  // Contract.configureNetwork() funct doesn't exist
  Contract.interfaceAdapter = createInterfaceAdapter({networkType:"ethereum", provider:web3.currentProvider})

  Contract.configureNetwork({networkType:"ethereum", provider:web3.currentProvider})
  // Contract._constructorMethods.configureNetwork({networkType:"ethereum", provider:web3.currentProvider})
  // Contract._constructorMethods().configureNetwork()
  
  
  // web3.eth.net.getId().then((networkId) => {
  //   Contract.setNetwork(networkId)
  //   console.log(`set ${networkId}`)
  // }).catch((error) => {
  //   console.error(error);
  // });
  // console.log("before return")
  Contract.defaults({from:"0x5409ed021d9299bf6814279a6a1411a7e866a631", gas: 13000000})
  return Contract
}

export function deploymentForContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  registerAddress: boolean,
  then?: (contract: ContractInstance, web3: Web3, networkName: string, proxy?: ProxyInstance) => void,
  artifactPath?: string
) {

  console.log("-> Started deployment for", name)
  let Contract 
  let ContractProxy
  if (artifactPath){
    Contract = makeTruffleContract(require(`../build/${artifactPath}/${name}.json`), web3)
    ContractProxy = makeTruffleContract(require(`../build/${artifactPath}/${name + 'Proxy'}.json`), web3)
  } else {
    Contract = artifacts.require(name)
    ContractProxy = artifacts.require(name + 'Proxy')
  }
  console.log("type is", typeof(Contract))
  console.log("Good artifacts2")
 
  const testingDeployment = false
  return (deployer: any, networkName: string, _accounts: string[]) => {
    // web3.eth.defaultAccount = _accounts[0]
    // Contract.address =  _accounts[0]
    // Contract.web3 = web3
    console.log('\n-> Deploying', name)

    ContractProxy.defaults({ from:"0x5409ed021d9299bf6814279a6a1411a7e866a631" })
    // Contract.defaults({ from:"0x5409ed021d9299bf6814279a6a1411a7e866a631" })
    console.log("Contract.defaults()", Contract.defaults())
    
    deployer.deploy(ContractProxy)
    // console.log(JSON.stringify(ContractProxy))
    console.log("deployed proxy")
    deployer.deploy(Contract, testingDeployment)
    // console.log(JSON.stringify(Contract))
    console.log("deployed contract")


    // Contract.at("0x0cDF34e216DAB593f00a95B2a4aaB735A1b421fC")
    // Contract.new(testingDeployment)
    console.log("testing works")

    // console.log("web3 version:", web3.version)
    // console.log("_accounts", _accounts)
    // console.log("interfaceAdapter", Contract.interfaceAdapter)
    // console.log(Contract.toJSON())
    

    deployer.then(async () => {
      console.log(0)
      // console.log("await web3.eth.getAccounts()", await web3.eth.getAccounts())
      const proxy: ProxyInstance = await ContractProxy.deployed()
      console.log(1)
      await proxy._transferOwnership(ContractProxy.defaults().from)
      console.log(2)
      // console.log(networkName)
      // console.log("Contract.networks1", Contract.networks)
      const proxiedContract: ContractInstance = await setInitialProxyImplementation<
        ContractInstance
      >(web3, artifacts, name, Contract, ContractProxy, ...(await args(networkName)))
      console.log(3)
      if (registerAddress) {
        console.log(4)
        const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
        console.log(5)
        await registry.setAddressFor(name, proxiedContract.address)
      }
      console.log(7)
      if (then) {
        console.log(8)
        await then(proxiedContract, web3, networkName, ContractProxy)
        console.log(9)
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

export async function transferOwnershipOfProxyExternal(
  Proxy: any,
  owner: string,
) {
  // const Proxy = artifacts.require(contractName + 'Proxy')
  const proxy: ProxyInstance = await Proxy.deployed()
  await proxy._transferOwnership(owner)
}

export async function transferOwnershipOfProxy(
  contractName: string,
  owner: string,
  artifacts: any
) {
  const Proxy = artifacts.require(contractName + 'Proxy')
  const proxy: ProxyInstance = await Proxy.deployed()
  await proxy._transferOwnership(owner)
}

export async function transferOwnershipOfProxyAndImplementation<
  ContractInstance extends OwnableInstance
>(contractName: string, owner: string, artifacts: any) {
  console.log(`  Transferring ownership of ${contractName} and its Proxy to ${owner}`)
  const contract: ContractInstance = await getDeployedProxiedContract<ContractInstance>(
    contractName,
    artifacts
  )
  await contract.transferOwnership(owner)
  await transferOwnershipOfProxy(contractName, owner, artifacts)
}

// TODO(asa): Share this code with mobile.
export async function createInviteCode(
  goldToken: GoldTokenInstance,
  stableToken: StableTokenInstance,
  invitationStableTokenAmount: BigNumber,
  gasPrice: number,
  web3: Web3
) {
  // TODO(asa): This number was made up
  const verificationGasAmount = new BigNumber(10000000)
  if (!gasPrice) {
    // TODO: this default gas price might not be accurate
    gasPrice = 0
  }
  const temporaryWalletAccount = await web3.eth.accounts.create()
  const temporaryAddress = temporaryWalletAccount.address
  // Buffer.from doesn't expect a 0x for hex input
  const privateKeyHex = temporaryWalletAccount.privateKey.substring(2)
  const inviteCode = Buffer.from(privateKeyHex, 'hex').toString('base64')
  await goldToken.transfer(temporaryAddress, verificationGasAmount.times(gasPrice).toString())
  await stableToken.transfer(temporaryAddress, invitationStableTokenAmount.toString())
  return [temporaryAddress, inviteCode]
}

export async function sendEscrowedPayment(
  contract: StableTokenInstance,
  escrow: EscrowInstance,
  phone: string,
  value: number,
  paymentID: string
) {
  console.log(
    'Transferring',
    await convertFromContractDecimals(value, contract),
    await contract.symbol(),
    'to',
    phone,
    'via Escrow.'
  )
  // @ts-ignore
  const phoneHash: string = Web3.utils.soliditySha3({
    type: 'string',
    value: phone,
  })

  await contract.approve(escrow.address, value.toString())
  const expirySeconds = 60 * 60 * 24 * 5 // 5 days
  await escrow.transfer(phoneHash, contract.address, value.toString(), expirySeconds, paymentID, 0)
}

/*
* Builds and returns mapping of function names to selectors.
* Each function name maps to an array of selectors to account for overloading.
*/
export function getFunctionSelectorsForContract(contract: any, contractName: string, artifacts: Truffle.Artifacts) {
  const selectors: { [index: string]: string[] } = {}
  const proxy: any = artifacts.require(contractName + 'Proxy')
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
    if (importedContractName ===  baseContractName) {
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
