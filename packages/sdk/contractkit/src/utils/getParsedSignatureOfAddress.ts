import { Connection } from '@celo/connect'
import { parseSignature } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'

export const getParsedSignatureOfAddress = async (
  sha3: Web3['utils']['soliditySha3'],
  sign: Connection['sign'],
  address: string,
  signer: string
) => {
  const addressHash = sha3({ type: 'address', value: address })!
  const signature = await sign(addressHash, signer)
  return parseSignature(addressHash, signature, signer)
}
