import { Address } from '@celo/utils/lib/address'
import { ProxyInstance } from 'types'
import Web3 from 'web3'


export async function setAndInitializeImplementation(
  web3: Web3,
  proxy: ProxyInstance,
  implementationAddress: string,
  initializerAbi: any,
  from: Address,
  value: number | string,
  ...args: any[]
) {
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args)
  return proxy._setAndInitializeImplementation(implementationAddress, callData as any, { from, value })
}
