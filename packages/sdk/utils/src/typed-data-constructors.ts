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
