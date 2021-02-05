import { Address, bufferToHex, hexToBuffer, NULL_ADDRESS } from '@celo/base/lib/address'
import { retryTx } from 'lib/web3-utils'
import { SecureTrie } from 'merkle-patricia-tree'
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

  // @ts-ignore
  return proof.storageHash === bufferToHex(trie.root)
}

export async function setAndInitializeImplementation(
  web3: Web3,
  proxy: ProxyInstance,
  implementationAddress: string,
  name: string,
  initializerAbi: any,
  transferImplOwnershipAbi: any,
  txOptions: {
    from?: Address
    value?: string
  },
  ...initArgs: any[]
) {
  let implInitArgs = initArgs
  if (name == 'ReleaseGold') {
    implInitArgs = [
      Math.round(new Date().getTime() / 1000),
      0,
      1,
      1,
      1,
      false, // should not be revokable
      '0x0000000000000000000000000000000000000001',
      NULL_ADDRESS,
      NULL_ADDRESS,
      true, // subjectToLiquidityProivision
      0,
      false, // canValidate
      false, // canVote
      '0x0000000000000000000000000000000000000001'
    ]
  }
  const initCallData = web3.eth.abi.encodeFunctionCall(initializerAbi, initArgs)
  const implInitCallData = web3.eth.abi.encodeFunctionCall(initializerAbi, implInitArgs)
  const transferImplOwnershipCallData = web3.eth.abi.encodeFunctionCall(transferImplOwnershipAbi, ['0x0000000000000000000000000000000000000001'])
  if (txOptions.from != null) {
    // First, initialize the implementation contract and lock its owneship
    await retryTx(web3.eth.sendTransaction, [{
      from: txOptions.from,
      to: implementationAddress,
      data: implInitCallData
    }]) 
    await retryTx(web3.eth.sendTransaction, [{
      from: txOptions.from,
      to: implementationAddress,
      data: transferImplOwnershipCallData
    }]) 

    // Then, initialize the proxy and connect it to the implementation contract
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
      initCallData as any,
      { from: txOptions.from },
    ])
  } else {
    // Initialize the implementation contract and lock its ownership
    await retryTx(web3.eth.sendTransaction, [{
      to: implementationAddress,
      data: implInitCallData
    }])
    await retryTx(web3.eth.sendTransaction, [{
      to: implementationAddress,
      data: transferImplOwnershipCallData
    }])
    // Initialize the proxy and connect it to the implementation contract  
    return retryTx(proxy._setAndInitializeImplementation, [implementationAddress, initCallData as any])
  }
}
