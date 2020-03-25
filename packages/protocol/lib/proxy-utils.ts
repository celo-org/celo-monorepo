import Web3 from 'web3'

import { ProxyInstance } from 'types'

export async function setAndInitializeImplementation(
  web3: Web3,
  proxy: ProxyInstance,
  implementationAddress: string,
  initializerAbi: any,
  ...args: any[]
) {
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args)
  return proxy._setAndInitializeImplementation(implementationAddress, callData as any)
}
