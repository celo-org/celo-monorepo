import { ensureLeading0x } from '@celo/base'
import { Address } from '@celo/utils/lib/address'
import { generateTypedDataHash, structHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import { registerAttestation as getTypedData } from '@celo/utils/lib/typed-data-constructors'

export const getSignatureForAttestation = async (
  identifier: string,
  issuer: string,
  account: string,
  issuedOn: number,
  signer: string,
  chainId: number,
  contractAddress: string
) => {
  const typedData = getTypedData(chainId, contractAddress, { identifier,issuer,account, signer, issuedOn})

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

  const messageHash = ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
  const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
  return parsedSignature
}

export const getDomainDigest = (contractAddress: Address) => {
  const typedData = getTypedData(1, contractAddress)
  return ensureLeading0x(
    structHash('EIP712Domain', typedData.domain, typedData.types).toString('hex')
  )
}