import { Address } from '@celo/utils/lib/address'
import * as prompts from 'prompts'
import { ProxyInstance } from 'types'
import Web3 from 'web3'


export async function retryTx(fn: any, args: any[]) {
  while (true) {
    try {
      const rvalue = await fn(...args)
      return rvalue
    } catch (e) {
      console.error(e)
      await prompts({
        type: 'confirm',
        name: 'confirmation',
        message: 'Error while sending tx, press enter when resolved to try again',
      })
    }
  }
}
export async function setAndInitializeImplementation(
  web3: Web3,
  proxy: ProxyInstance,
  implementationAddress: string,
  initializerAbi: any,
  txOptions: {
    from?: Address
    value?: string
  },
  ...args: any[]
) {
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args)
  if (txOptions.from != null) {
    // The proxied contract needs to be funded prior to initialization
    if (txOptions.value != null) {
      // Proxy's fallback fn expects the contract's implementation to be set already
      // So we set the implementation first, send the funding, and then set and initialize again.
      await retryTx(proxy._setImplementation, [implementationAddress, { from: txOptions.from }])
      await retryTx(web3.eth.sendTransaction, [{
        from: txOptions.from,
        to: proxy.address,
        value: txOptions.value,
      }])
    }
    return retryTx(proxy._setAndInitializeImplementation, [implementationAddress, callData as any, { from: txOptions.from }])
  } else {
    return retryTx(proxy._setAndInitializeImplementation, [implementationAddress, callData as any])
  }
}
