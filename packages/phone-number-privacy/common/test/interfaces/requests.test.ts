import {
  EIP712Object,
  generateTypedDataHash,
  noBool,
  noNumber,
  noString,
  some,
} from '@celo/utils/lib/sign-typed-data-utils'
import { Domain, DomainOptions, SequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import {
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestEIP712,
  DomainQuotaStatusRequest,
  DisableDomainRequest,
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
        stages: [
          { delay: 0, resetTimer: noBool, batchSize: some(2), repetitions: noNumber },
          { delay: 1, resetTimer: some(false), batchSize: noNumber, repetitions: noNumber },
          { delay: 1, resetTimer: some(true), batchSize: noNumber, repetitions: noNumber },
          { delay: 2, resetTimer: some(false), batchSize: noNumber, repetitions: some(1) },
          { delay: 4, resetTimer: noBool, batchSize: some(2), repetitions: some(2) },
        ],
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
    const expectedHash = '3eb23d972e778fd435b13c468ebdb71fb0eb7d52980bdc70d8b4b37885596626'
    const typedData = domainRestrictedSignatureRequestEIP712(request)
    console.debug(JSON.stringify(typedData, null, 2))
    expect(generateTypedDataHash(typedData).toString('hex')).toEqual(expectedHash)
  })
})
