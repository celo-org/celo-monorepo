import { Address, ensureLeading0x } from '@celo/utils/lib/address'
import { generateTypedDataHash, structHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'

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
  return ensureLeading0x(
    structHash('EIP712Domain', typedData.domain, typedData.types).toString('hex')
  )
}

export const constructMetaTransactionExecutionDigest = (walletAddress: Address, tx: MetaTransaction) => {
  const typedData = getTypedData(walletAddress, tx)
  return ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
}

export const getSignatureForMetaTransaction = async (
  signer: Address,
  walletAddress: Address,
  tx: MetaTransaction
) => {
  const typedData = getTypedData(walletAddress, tx)

  const signature = await new Promise<string>((resolve, reject) => {
    web3.currentProvider.send(
      {
        method: 'eth_signTypedData',
        params: [signer, typedData],
      },
      (error, resp) => {
        if (error) {
          reject(error)
        } else {
          resolve(resp.result)
        }
      }
    )
  })

  const messageHash = constructMetaTransactionExecutionDigest(walletAddress, tx)
  const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
  return parsedSignature
}
