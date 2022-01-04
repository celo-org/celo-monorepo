import {
  defined,
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noString,
  noNumber,
} from '@celo/utils/lib/sign-typed-data-utils'
import { Domain, DomainOptions, SequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { LocalWallet } from '@celo/wallet-local'
import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DisableDomainRequest,
  disableDomainRequestEIP712,
  verifyDisableDomainRequestSignature,
  verifyDomainQuotaStatusRequestSignature,
  verifyDomainRestrictedSignatureRequestSignature,
} from '../../src/interfaces/requests'

// Compile-time check that DomainRestrictedSignatureRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<Domain>
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<
  Domain,
  DomainOptions
>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = ({} as unknown) as DomainQuotaStatusRequest
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = ({} as unknown) as DomainQuotaStatusRequest<Domain>
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = ({} as unknown) as DomainQuotaStatusRequest<
  Domain,
  DomainOptions
>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712: EIP712Object
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = ({} as unknown) as DisableDomainRequest
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = ({} as unknown) as DisableDomainRequest<Domain>
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = ({} as unknown) as DisableDomainRequest<
  Domain,
  DomainOptions
>

describe('domainRestrictedSignatureRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
      domain: {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: defined('<signature>'),
        nonce: defined(1),
      },
      blindedMessage: '<blinded message>',
      sessionID: noString,
    }
    const expectedHash = 'bc958fdbf83dfa7253b9ad1d9a8c5a803617f7acbed9684ff4fda669647956b5'
    const typedData = domainRestrictedSignatureRequestEIP712(request)
    // console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})

describe('domainQuotaStatusRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DomainQuotaStatusRequest<SequentialDelayDomain> = {
      domain: {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: defined('<signature>'),
        nonce: defined(2),
      },
      sessionID: noString,
    }
    const expectedHash = '7fcd55bc848bb89bb14cee5f5b08a4ae3224b26fbffb86385e2b64056862de62'
    const typedData = domainQuotaStatusRequestEIP712(request)
    //console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})

describe('disableDomainRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DisableDomainRequest<SequentialDelayDomain> = {
      domain: {
        name: 'ODIS Sequential Delay Domain',
        version: '1',
        stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
        address: defined('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: defined('<signature>'),
        nonce: defined(2),
      },
      sessionID: noString,
    }
    const expectedHash = '150d96add3ad0c9ec4f72638fd1e452fb477c7aedde09bc3c67fa2611cbdc581'
    const typedData = disableDomainRequestEIP712(request)
    console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})

const wallet = new LocalWallet()
wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000bad516e9')
const walletAddress = wallet.getAccounts()[0]!
const badAddress = wallet.getAccounts()[1]!

const authenticatedDomain: SequentialDelayDomain = {
  name: 'ODIS Sequential Delay Domain',
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
  address: defined(walletAddress),
  salt: noString,
}

const unauthenticatedDomain: SequentialDelayDomain = {
  name: 'ODIS Sequential Delay Domain',
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
  address: noString,
  salt: noString,
}

const manipulatedDomain: SequentialDelayDomain = {
  name: 'ODIS Sequential Delay Domain',
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(100), repetitions: defined(10) }],
  address: defined(walletAddress),
  salt: noString,
}

const cases = [
  {
    request: {
      domain: authenticatedDomain,
      options: {
        signature: noString,
        nonce: defined(0),
      },
      blindedMessage: '<blinded message>',
      sessionID: noString,
    } as DomainRestrictedSignatureRequest<SequentialDelayDomain>,
    typedDataBuilder: domainRestrictedSignatureRequestEIP712,
    verifier: verifyDomainRestrictedSignatureRequestSignature,
    name: 'verifyDomainRestrictedSignatureRequestSignature()',
  },
  {
    request: {
      domain: authenticatedDomain,
      options: {
        signature: noString,
        nonce: defined(0),
      },
      sessionID: noString,
    } as DomainQuotaStatusRequest<SequentialDelayDomain>,
    typedDataBuilder: domainQuotaStatusRequestEIP712,
    verifier: verifyDomainQuotaStatusRequestSignature,
    name: 'verifyDomainQuotaStatusRequestSignature()',
  },
  {
    request: {
      domain: authenticatedDomain,
      options: {
        signature: noString,
        nonce: defined(0),
      },
      sessionID: noString,
    } as DisableDomainRequest<SequentialDelayDomain>,
    typedDataBuilder: disableDomainRequestEIP712,
    verifier: verifyDisableDomainRequestSignature,
    name: 'verifyDisableDomainRequestSignature()',
  },
]

for (const { request, verifier, typedDataBuilder, name } of cases) {
  describe(name, () => {
    it('should report a correctly signed request as verified', async () => {
      //@ts-ignore type checking does not correctly infer types.
      const typedData = typedDataBuilder(request)
      const signature = await wallet.signTypedData(walletAddress, typedData)
      const signed = {
        ...request,
        options: {
          ...request.options,
          signature: defined(signature),
        },
      }

      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(signed)).toBe(true)
    })

    it('should report an unsigned message as unverified', async () => {
      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(request)).toBe(false)
    })

    it('should report a manipulated message as unverified', async () => {
      //@ts-ignore type checking does not correctly infer types.
      const typedData = typedDataBuilder(request)
      const signature = await wallet.signTypedData(walletAddress, typedData)
      const signed = {
        ...request,
        options: {
          ...request.options,
          signature: defined(signature),
        },
      }
      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(signed)).toBe(true)

      const manipulated = { ...request, domain: manipulatedDomain }
      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(manipulated)).toBe(false)
    })

    it('should report an incorrectly signed request as unverified', async () => {
      //@ts-ignore type checking does not correctly infer types.
      const typedData = typedDataBuilder(request)
      const signature = await wallet.signTypedData(badAddress, typedData)
      const signed = {
        ...request,
        options: {
          ...request.options,
          signature: defined(signature),
        },
      }

      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(signed)).toBe(false)
    })

    it('should report requests against unauthenticated domains to be unverified', async () => {
      const unauthenticatedRequest = {
        ...request,
        domain: unauthenticatedDomain,
        options: {
          signature: noString,
          nonce: noNumber,
        },
      }
      //@ts-ignore type checking does not correctly infer types.
      expect(verifier(unauthenticatedRequest)).toBe(false)
    })
  })
}
