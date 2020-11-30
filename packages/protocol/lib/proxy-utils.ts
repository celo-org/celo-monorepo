import { Address, bufferToHex, hexToBuffer } from '@celo/base/lib/address'
import { SecureTrie } from 'merkle-patricia-tree'
import prompts from 'prompts'
import { encode as rlpEncode } from 'rlp'
import { ProxyInstance } from 'types'
import Web3 from 'web3'

// from Proxy.sol

// bytes32 private constant OWNER_POSITION = bytes32(
//   uint256(keccak256("eip1967.proxy.admin")) - 1
// );
const OWNER_POSITION = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'

// bytes32 private constant IMPLEMENTATION_POSITION = bytes32(
//   uint256(keccak256("eip1967.proxy.implementation")) - 1
// );
const IMPLEMENTATION_POSITION = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

export async function verifyProxyStorageProof(web3: Web3, proxy: string, owner: string) {
  const proof = await web3.eth.getProof(
    web3.utils.toChecksumAddress(proxy),
    [OWNER_POSITION, IMPLEMENTATION_POSITION],
    'latest'
  )

  const trie = new SecureTrie()
  await trie.put(hexToBuffer(OWNER_POSITION), rlpEncode(owner))
  // for future use
  // await trie.put(hexToBuffer(IMPLEMENTATION_POSITION), rlpEncode(implementation))

  // @ts-ignore
  return proof.storageHash === bufferToHex(trie.root)
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
      await retryTx(web3.eth.sendTransaction, [
        {
          from: txOptions.from,
          to: proxy.address,
          value: txOptions.value,
        },
      ])
    }
    return retryTx(proxy._setAndInitializeImplementation, [
      implementationAddress,
      callData as any,
      { from: txOptions.from },
    ])
  } else {
    return retryTx(proxy._setAndInitializeImplementation, [implementationAddress, callData as any])
  }
}
