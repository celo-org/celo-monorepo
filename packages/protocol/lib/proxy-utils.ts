import { Address } from '@celo/utils/lib/address'
import { ProxyInstance } from 'types'
import Web3 from 'web3'


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
      await proxy._setImplementation(implementationAddress, { from: txOptions.from })
      await web3.eth.sendTransaction({
        from: txOptions.from,
        to: proxy.address,
        value: txOptions.value,
      })
    }
    return proxy._setAndInitializeImplementation(implementationAddress, callData as any, { from: txOptions.from })
  } else {
    return proxy._setAndInitializeImplementation(implementationAddress, callData as any)
  }
}
