import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'

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
