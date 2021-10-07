import {
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noString,
  some,
} from '@celo/utils/lib/sign-typed-data-utils'
import { Domain, DomainOptions, SequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainQuotaStatusRequest,
  domainQuotaStatusRequestEIP712,
  DisableDomainRequest,
  disableDomainRequestEIP712,
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
        stages: [{ delay: 0, resetTimer: noBool, batchSize: some(2), repetitions: some(10) }],
        publicKey: some('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: some('<signature>'),
        nonce: some(1),
      },
      blindedMessage: '<blinded message>',
      sessionID: noString,
    }
    const expectedHash = 'cffd7418d08525974200e82ba7c97096aeb72bcedcf37973b362db61b32597aa'
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
        stages: [{ delay: 0, resetTimer: noBool, batchSize: some(2), repetitions: some(10) }],
        publicKey: some('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: some('<signature>'),
        nonce: some(2),
      },
      sessionID: noString,
    }
    const expectedHash = '2630b7fb6ed7699c13269aaa6305202071da5adf773870441986aed41a99bdd5'
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
        stages: [{ delay: 0, resetTimer: noBool, batchSize: some(2), repetitions: some(10) }],
        publicKey: some('0x0000000000000000000000000000000000000b0b'),
        salt: noString,
      },
      options: {
        signature: some('<signature>'),
        nonce: some(2),
      },
      sessionID: noString,
    }
    const expectedHash = '57e7a118b00482f4e56e43d3d3e185a45a3ccae0bfb8c84a9ee0e36e4b659635'
    const typedData = disableDomainRequestEIP712(request)
    console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})
