import { Address } from '@celo/utils/lib/address';
import { generateTypedDataHash, structHash } from '@celo/utils/lib/sign-typed-data-utils';
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils';
import {
  bufferToHex
} from '@ethereumjs/util';

export interface MetaTransaction {
  destination: Address
  value: number
  data: string
  nonce: number
}
// The value currently returned by the chainId assembly code in ganache.
const chainId = 1
const getTypedData = (walletAddress: Address, tx?: MetaTransaction) => {
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ExecuteMetaTransaction: [
        { name: 'destination', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'ExecuteMetaTransaction',
    domain: {
      name: 'MetaTransactionWallet',
      version: '1.1',
      chainId,
      verifyingContract: walletAddress,
    },
    message: tx ? tx : {},
  }
  return typedData
}

export const getDomainDigest = (walletAddress: Address) => {
  const typedData = getTypedData(walletAddress)
  return bufferToHex(
    structHash('EIP712Domain', typedData.domain, typedData.types)
  )
}

export const constructMetaTransactionExecutionDigest = (walletAddress: Address, tx: MetaTransaction) => {
  const typedData = getTypedData(walletAddress, tx)
  return bufferToHex(generateTypedDataHash(typedData) )
}

export const getSignatureForMetaTransaction = async (
  signer: Address,
  walletAddress: Address,
  tx: MetaTransaction
) => {
  const typedData = getTypedData(walletAddress, tx)

  const signature = await web3.currentProvider.request({ 
    method: 'eth_signTypedData',params: [signer, typedData],
  })

  const messageHash = constructMetaTransactionExecutionDigest(walletAddress, tx)
  const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
  return parsedSignature
}
