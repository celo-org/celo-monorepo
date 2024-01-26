import { Address } from '@celo/utils/lib/address';
import { generateTypedDataHash, structHash } from '@celo/utils/lib/sign-typed-data-utils';
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils';
import { registerAttestation as getTypedData } from '@celo/utils/lib/typed-data-constructors';
import {
  bufferToHex
} from '@ethereumjs/util';

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
      (error: Error, resp: {result: string}) => {
        if (error) {
          reject(error)
        } else {
          resolve(resp.result)
        }
      }
    )
  })

  const messageHash = bufferToHex(generateTypedDataHash(typedData))
  const parsedSignature = parseSignatureWithoutPrefix(messageHash, signature, signer)
  return parsedSignature
}

export const getDomainDigest = (contractAddress: Address) => {
  const typedData = getTypedData(1, contractAddress)
  return  bufferToHex(structHash('EIP712Domain', typedData.domain, typedData.types))
}