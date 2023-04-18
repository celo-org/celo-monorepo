import {
  defined,
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noNumber,
  noString,
} from '@celo/utils/lib/sign-typed-data-utils'
import { LocalWallet } from '@celo/wallet-local'
import { bufferToHex } from '@ethereumjs/util'
import {
  Domain,
  DomainIdentifiers,
  SequentialDelayDomain,
  SequentialDelayDomainSchema,
} from '../../src/domains'
import {
  DisableDomainRequest,
  disableDomainRequestEIP712,
  disableDomainRequestSchema,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  domainQuotaStatusRequestSchema,
  DomainRequestTypeTag,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  domainRestrictedSignatureRequestSchema,
  verifyDisableDomainRequestAuthenticity,
  verifyDomainQuotaStatusRequestAuthenticity,
  verifyDomainRestrictedSignatureRequestAuthenticity,
} from '../../src/interfaces/requests'

// Compile-time check that DomainRestrictedSignatureRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 =
  {} as unknown as DomainRestrictedSignatureRequest
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 =
  {} as unknown as DomainRestrictedSignatureRequest<Domain>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = {} as unknown as DomainQuotaStatusRequest
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = {} as unknown as DomainQuotaStatusRequest<Domain>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712: EIP712Object
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = {} as unknown as DisableDomainRequest
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = {} as unknown as DisableDomainRequest<Domain>

describe('domainRestrictedSignatureRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.SIGN,
      domain: {
        name: DomainIdentifiers.SequentialDelay,
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
    const expectedHash = '0x9914e6bc3bd0d63727eeae4008654920b9879654f7159b1d5ab33768e61f56df'
    const typedData = domainRestrictedSignatureRequestEIP712(request)
    // console.debug(JSON.stringify(typedData, null, 2))
    expect(bufferToHex(generateTypedDataHash(typedData))).toEqual(expectedHash)
  })
})

describe('domainQuotaStatusRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DomainQuotaStatusRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.QUOTA,
      domain: {
        name: DomainIdentifiers.SequentialDelay,
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
    const expectedHash = '0x0c1545b83f28d8d0f24886fa0d21ac540af706dd6f9ee6d045bac17780a2656e'
    const typedData = domainQuotaStatusRequestEIP712(request)
    //console.debug(JSON.stringify(typedData, null, 2))
    expect(bufferToHex(generateTypedDataHash(typedData))).toEqual(expectedHash)
  })
})

describe('disableDomainRequestEIP712()', () => {
  it('should generate the correct type data for request with SequentialDelayDomain', () => {
    const request: DisableDomainRequest<SequentialDelayDomain> = {
      type: DomainRequestTypeTag.DISABLE,
      domain: {
        name: DomainIdentifiers.SequentialDelay,
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
    const expectedHash = '0xd30be7d1b1bb3a9a0b2b2148d9ea3fcae7775dc31ce984d658f90295887a323a'
    const typedData = disableDomainRequestEIP712(request)
    console.debug(JSON.stringify(typedData, null, 2))
    expect(bufferToHex(generateTypedDataHash(typedData))).toEqual(expectedHash)
  })
})

const wallet = new LocalWallet()
wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000deadbeef')
wallet.addAccount('0x00000000000000000000000000000000000000000000000000000000bad516e9')
const walletAddress = wallet.getAccounts()[0]!
const badAddress = wallet.getAccounts()[1]!

const authenticatedDomain: SequentialDelayDomain = {
  name: DomainIdentifiers.SequentialDelay,
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
  address: defined(walletAddress),
  salt: noString,
}

const unauthenticatedDomain: SequentialDelayDomain = {
  name: DomainIdentifiers.SequentialDelay,
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
  address: noString,
  salt: noString,
}

const manipulatedDomain: SequentialDelayDomain = {
  name: DomainIdentifiers.SequentialDelay,
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(100), repetitions: defined(10) }],
  address: defined(walletAddress),
  salt: noString,
}

const signatureRequest: DomainRestrictedSignatureRequest<SequentialDelayDomain> = {
  type: DomainRequestTypeTag.SIGN,
  domain: authenticatedDomain,
  options: {
    signature: noString,
    nonce: defined(0),
  },
  blindedMessage: '<blinded message>',
  sessionID: noString,
}

const quotaRequest: DomainQuotaStatusRequest<SequentialDelayDomain> = {
  type: DomainRequestTypeTag.QUOTA,
  domain: authenticatedDomain,
  options: {
    signature: noString,
    nonce: defined(0),
  },
  sessionID: noString,
}

const disableRequest: DisableDomainRequest<SequentialDelayDomain> = {
  type: DomainRequestTypeTag.DISABLE,
  domain: authenticatedDomain,
  options: {
    signature: noString,
    nonce: defined(0),
  },
  sessionID: noString,
}

const verifyCases = [
  {
    request: signatureRequest,
    typedDataBuilder: domainRestrictedSignatureRequestEIP712,
    verifier: verifyDomainRestrictedSignatureRequestAuthenticity,
    name: 'verifyDomainRestrictedSignatureRequestAuthenticity()',
  },
  {
    request: quotaRequest,
    typedDataBuilder: domainQuotaStatusRequestEIP712,
    verifier: verifyDomainQuotaStatusRequestAuthenticity,
    name: 'verifyDomainQuotaStatusRequestAuthenticity()',
  },
  {
    request: disableRequest,
    typedDataBuilder: disableDomainRequestEIP712,
    verifier: verifyDisableDomainRequestAuthenticity,
    name: 'verifyDisableDomainRequestAuthenticity()',
  },
]

for (const { request, verifier, typedDataBuilder, name } of verifyCases) {
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

const schemaCases = [
  {
    request: signatureRequest,
    schema: domainRestrictedSignatureRequestSchema(SequentialDelayDomainSchema),
    name: 'verifyDomainRestrictedSignatureRequestSignature()',
  },
  {
    request: quotaRequest,
    schema: domainQuotaStatusRequestSchema(SequentialDelayDomainSchema),
    name: 'verifyDomainQuotaStatusRequestSignature()',
  },
  {
    request: disableRequest,
    schema: disableDomainRequestSchema(SequentialDelayDomainSchema),
    name: 'verifyDisableDomainRequestSignature()',
  },
]

for (const { request, schema, name } of schemaCases) {
  describe(name, () => {
    it('should report a correctly constructed request as validated', async () => {
      expect(schema.is(request)).toBe(true)
    })

    it('should report an invalid request as not validated', async () => {
      expect(schema.is({ ...request, options: {} })).toBe(false)
    })
  })
}
