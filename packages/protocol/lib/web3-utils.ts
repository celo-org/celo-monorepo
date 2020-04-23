/* tslint:disable:no-console */
// TODO(asa): Refactor and rename to 'deployment-utils.ts'
import { retryTx, setAndInitializeImplementation } from '@celo/protocol/lib/proxy-utils'
import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { signTransaction } from '@celo/protocol/lib/signing-utils'
import { Address, privateKeyToAddress } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import { EscrowInstance, GoldTokenInstance, MultiSigInstance, OwnableInstance, ProxyContract, ProxyInstance, RegistryInstance, StableTokenInstance } from 'types'
import Web3 from 'web3'
import { TransactionObject } from 'web3-eth'


export async function sendTransactionWithPrivateKey<T>(
  web3: Web3,
  tx: TransactionObject<T> | null,
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

function checkFunctionArgsLength(args: any[], abi: any) {
  if (args.length !== abi.inputs.length) {
    throw new Error(`Incorrect number of arguments to Solidity function: ${abi.name}`)
  }
}

export async function setInitialProxyImplementation<
  ContractInstance extends Truffle.ContractInstance
>(web3: Web3, artifacts: any, contractName: string, ...args: any[]): Promise<ContractInstance> {
  const Contract: Truffle.Contract<ContractInstance> = artifacts.require(contractName)
  const ContractProxy: Truffle.Contract<ProxyInstance> = artifacts.require(contractName + 'Proxy')

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
  then?: (contract: ContractInstance, web3: Web3, networkName: string) => void
) {
  return deploymentForContract(web3, artifacts, name, args, true, then);
}

export function deploymentForProxiedContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  then?: (contract: ContractInstance, web3: Web3, networkName: string) => void
) {
  return deploymentForContract(web3, artifacts, name, args, false, then);

}

export function deploymentForContract<ContractInstance extends Truffle.ContractInstance>(
  web3: Web3,
  artifacts: any,
  name: CeloContractName,
  args: (networkName?: string) => Promise<any[]> = async () => [],
  registerAddress: boolean,
  then?: (contract: ContractInstance, web3: Web3, networkName: string) => void
) {
  const Contract = artifacts.require(name)
  const ContractProxy = artifacts.require(name + 'Proxy')
  return (deployer: any, networkName: string, _accounts: string[]) => {
    console.log('Deploying', name)
    deployer.deploy(ContractProxy)
    deployer.deploy(Contract)
    deployer.then(async () => {
      const proxy: ProxyInstance = await ContractProxy.deployed()
      await proxy._transferOwnership(ContractProxy.defaults().from)
      const proxiedContract: ContractInstance = await setInitialProxyImplementation<
        ContractInstance
      >(web3, artifacts, name, ...(await args(networkName)))

      if (registerAddress) {
        const registry = await getDeployedProxiedContract<RegistryInstance>('Registry', artifacts)
        await registry.setAddressFor(name, proxiedContract.address)
      }

      if (then) {
        await then(proxiedContract, web3, networkName)
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
