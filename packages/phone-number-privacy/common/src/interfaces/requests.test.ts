import { EIP712Object } from '@celo/utils/lib/sign-typed-data-utils'
import { Domain, DomainOptions } from '@celo/identity/lib/odis/domains'
import {
  DomainRestrictedSignatureRequest,
  DomainQuotaStatusRequest,
  DisableDomainRequest,
} from './requests'

// Compile-time check that DomainRestrictedSignatureRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<Domain>
TEST_DOMAIN_RESTRICTED_SIGNATURE_REQUEST_IS_EIP712 = ({} as unknown) as DomainRestrictedSignatureRequest<
  Domain,
  DomainOptions
>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712: EIP712Object
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = ({} as unknown) as DomainQuotaStatusRequest<Domain>
TEST_DOMAIN_QUOTA_STATUS_REQUEST_IS_EIP712 = ({} as unknown) as DomainQuotaStatusRequest<
  Domain,
  DomainOptions
>

// Compile-time check that DomainQuotaStatusRequest can be cast to type EIP712Object.
export let TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712: EIP712Object
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = ({} as unknown) as DisableDomainRequest<Domain>
TEST_DISABLE_DOMAIN_REQUEST_IS_EIP712 = ({} as unknown) as DisableDomainRequest<
  Domain,
  DomainOptions
>
