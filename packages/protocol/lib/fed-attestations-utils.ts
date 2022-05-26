import { ensureLeading0x } from '@celo/base'
import { Address } from '@celo/utils/lib/address'
import { structHash } from '@celo/utils/lib/sign-typed-data-utils'
import { generateTypedDataHash } from '@celo/utils/src/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/src/signatureUtils'

export interface AttestationDetails{
  identifier: string,
  issuer: string,
  account: string,
  issuedOn: number,
}

const getTypedData = (chainId: number, contractAddress: Address, message?: AttestationDetails) => {
  const typedData =  {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256'}, 
        { name: 'verifyingContract', type: 'address'}, 
      ],
      OwnershipAttestation: [
          { name: 'identifier', type: 'bytes32' },
          { name: 'issuer', type: 'address'},
          { name: 'account', type: 'address' },
          { name: 'issuedOn', type: 'uint64' },
          // TODO ASv2 Consider including a nonce (which could also be used as an ID)
      ],
    },
    primaryType: 'OwnershipAttestation',
    domain: {
      name: 'FederatedAttestations',
      version: '1.0',
      chainId,
      verifyingContract: contractAddress
    },
    message: message ? message : {}
  }
  return typedData
}

export const getSignatureForAttestation = async (
  identifier: string,
  issuer: string,
  account: string,
  issuedOn: number,
  signer: string,
  chainId: number,
  contractAddress: string
) => {
  const typedData = getTypedData(chainId, contractAddress, { identifier,issuer,account, issuedOn})

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