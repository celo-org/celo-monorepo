import Web3 = require('web3')

import { ProxyInstance } from 'types'

export function setAndInitializeImplementation(
  web3: Web3,
  proxy: ProxyInstance,
  implementationAddress: string,
  initializerAbi: any,
  ...args: any[]
) {
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args)

  // @ts-ignore
  return proxy._setAndInitializeImplementation(implementationAddress, callData)
}
