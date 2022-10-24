import { Address, ensureLeading0x } from '@celo/base'
import { generateTypedDataHash } from '@celo/utils/lib/sign-typed-data-utils'
import { parseSignatureWithoutPrefix } from '@celo/utils/lib/signatureUtils'
import Web3 from 'web3'
import { EIP712TypedData } from './sign-typed-data-utils'

export function attestationSecurityCode(code: string): EIP712TypedData {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
      AttestationRequest: [{ name: 'code', type: 'string' }],
    },
    primaryType: 'AttestationRequest',
    domain: {
      name: 'Attestations',
      version: '1.0.0',
    },
    message: {
      code,
    },
  }
}

export const authorizeSigner = ({
  account,
  signer,
  chainId,
  role,
  accountsContractAddress,
}: {
  chainId: number
  signer: string
  account: string
  role: string
  accountsContractAddress: string
}): EIP712TypedData => ({
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    AuthorizeSigner: [
      { name: 'account', type: 'address' },
      { name: 'signer', type: 'address' },
      { name: 'role', type: 'bytes32' },
    ],
  },
  primaryType: 'AuthorizeSigner',
  domain: {
    name: 'Celo Core Contracts',
    version: '1.0',
    chainId,
    verifyingContract: accountsContractAddress,
  },
  message: {
    account,
    signer,
    role,
  },
})

export interface AttestationDetails {
  identifier: string
  issuer: string
  account: string
  signer: string
  issuedOn: number
}

const getTypedData = (chainId: number, contractAddress: Address, message?: AttestationDetails) => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      OwnershipAttestation: [
        { name: 'identifier', type: 'bytes32' },
        { name: 'issuer', type: 'address' },
        { name: 'account', type: 'address' },
        { name: 'signer', type: 'address' },
        { name: 'issuedOn', type: 'uint64' },
      ],
    },
    primaryType: 'OwnershipAttestation',
    domain: {
      name: 'FederatedAttestations',
      version: '1.0',
      chainId,
      verifyingContract: contractAddress,
    },
    message: message ? message : {},
  }
}

export const getSignatureForAttestation = async (
  identifier: string,
  issuer: string,
  account: string,
  issuedOn: number,
  signer: string,
  chainId: number,
  contractAddress: string,
  web3: Web3
) => {
  const typedData = getTypedData(chainId, contractAddress, {
    identifier,
    issuer,
    account,
    signer,
    issuedOn,
  })

  const signature = await new Promise<string>((resolve, reject) => {
    // @ts-ignore
    web3.currentProvider.send(
      {
        method: 'eth_signTypedData',
        params: [signer, typedData],
      },
      (error: any, resp: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(resp.result)
        }
      }
    )
  })

  const messageHash = ensureLeading0x(generateTypedDataHash(typedData).toString('hex'))
  return parseSignatureWithoutPrefix(messageHash, signature, signer)
}
