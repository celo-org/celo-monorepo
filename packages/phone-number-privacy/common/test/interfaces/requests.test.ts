import {
  defined,
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noString,
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
