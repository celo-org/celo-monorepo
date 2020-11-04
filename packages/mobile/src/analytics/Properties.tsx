import { CURRENCY_ENUM } from '@celo/utils'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  CeloExchangeEvents,
  ContractKitEvents,
  EscrowEvents,
  FeeEvents,
  FiatExchangeEvents,
  GethEvents,
  HomeEvents,
  IdentityEvents,
  InviteEvents,
  NetworkEvents,
  OnboardingEvents,
  RequestEvents,
  SendEvents,
  SettingsEvents,
  TransactionEvents,
  VerificationEvents,
} from 'src/analytics/Events'
import { BackQuizProgress, ScrollDirection } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RecipientKind } from 'src/recipients/recipient'

interface AppEventsProperties {
  [AppEvents.app_launched]: {
    // TODO: Figure out how to measure loadingDuration iOS and make param required
    reactLoadDuration?: number
    appLoadDuration?: number
    deviceInfo?: object
    deviceHeight: number
    deviceWidth: number
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.error_fallback]: {
    error: ErrorMessages
  }
  [AppEvents.error_boundary]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: string
    goldBalance?: string
  }
}

interface HomeEventsProperties {
  [HomeEvents.home_send]: undefined
  [HomeEvents.home_request]: undefined
  [HomeEvents.home_qr]: undefined
  [HomeEvents.drawer_navigation]: {
    navigateTo: string
  }
  [HomeEvents.drawer_address_copy]: undefined

  [HomeEvents.notification_scroll]: {
    // TODO: Pass in notificationType and make param required
    notificationType?: NotificationBannerTypes
    direction: ScrollDirection
  }
  [HomeEvents.notification_select]: {
    notificationType: NotificationBannerTypes
    selectedAction: NotificationBannerCTATypes
  }
  [HomeEvents.transaction_feed_item_select]: undefined
  [HomeEvents.transaction_feed_address_copy]: undefined
}

interface SettingsEventsProperties {
  [SettingsEvents.settings_profile_edit]: undefined
  [SettingsEvents.settings_profile_name_edit]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }
  [SettingsEvents.settings_verify_number]: undefined
  [SettingsEvents.pin_require_on_load]: {
    enabled: boolean
  }
  [SettingsEvents.forno_toggle]: {
    enabled: boolean
  }
  [SettingsEvents.licenses_view]: undefined
  [SettingsEvents.tos_view]: undefined
  [SettingsEvents.start_account_removal]: undefined
  [SettingsEvents.completed_account_removal]: undefined
}

interface OnboardingEventsProperties {
  [OnboardingEvents.onboarding_education_start]: undefined
  [OnboardingEvents.onboarding_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.onboarding_education_complete]: undefined
  [OnboardingEvents.onboarding_education_cancel]: undefined

  [OnboardingEvents.create_account_start]: undefined
  [OnboardingEvents.create_account_cancel]: undefined

  [OnboardingEvents.restore_account_start]: undefined
  [OnboardingEvents.restore_account_cancel]: undefined

  [OnboardingEvents.backup_education_start]: undefined
  [OnboardingEvents.backup_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.backup_education_complete]: undefined
  [OnboardingEvents.backup_education_cancel]: undefined

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_complete]: undefined
  [OnboardingEvents.backup_more_info]: undefined
  [OnboardingEvents.backup_delay]: undefined
  [OnboardingEvents.backup_delay_confirm]: undefined
  [OnboardingEvents.backup_delay_cancel]: undefined
  [OnboardingEvents.backup_cancel]: undefined
  [OnboardingEvents.backup_error]: {
    error: string
    context?: string
  }

  [OnboardingEvents.backup_quiz_start]: undefined
  [OnboardingEvents.backup_quiz_progress]: {
    action: BackQuizProgress
  }
  [OnboardingEvents.backup_quiz_complete]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.celo_education_start]: undefined
  [OnboardingEvents.celo_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.celo_education_complete]: undefined
  [OnboardingEvents.celo_education_cancel]: undefined

  [OnboardingEvents.phone_number_set]: {
    countryCode: string
    country?: string
  }
  [OnboardingEvents.phone_number_invalid]: {
    obfuscatedPhoneNumber: string
  }

  [OnboardingEvents.pin_set]: undefined
  [OnboardingEvents.pin_invalid]: {
    error: string
  }
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: undefined

  [OnboardingEvents.wallet_import_start]: undefined
  [OnboardingEvents.wallet_import_complete]: undefined
  [OnboardingEvents.wallet_import_cancel]: undefined

  [OnboardingEvents.invite_redeem_start]: undefined
  [OnboardingEvents.invite_redeem_complete]: undefined
  [OnboardingEvents.invite_redeem_cancel]: undefined
  [OnboardingEvents.invite_redeem_timeout]: undefined
  [OnboardingEvents.invite_redeem_error]: {
    error: string
  }
  [OnboardingEvents.invite_redeem_move_funds_start]: undefined
  [OnboardingEvents.invite_redeem_move_funds_complete]: undefined

  [OnboardingEvents.invite_redeem_skip_start]: undefined
  [OnboardingEvents.invite_redeem_skip_complete]: undefined
  [OnboardingEvents.invite_redeem_skip_error]: {
    error: string
  }

  [OnboardingEvents.escrow_redeem_start]: undefined
  [OnboardingEvents.escrow_redeem_complete]: undefined
  [OnboardingEvents.escrow_redeem_error]: {
    error: string
  }

  [OnboardingEvents.account_dek_register_start]: undefined
  [OnboardingEvents.account_dek_register_account_unlocked]: undefined
  [OnboardingEvents.account_dek_register_account_checked]: undefined
  [OnboardingEvents.account_dek_register_complete]: {
    newRegistration: boolean
  }
}

interface VerificationEventsProperties {
  [VerificationEvents.verification_start]: undefined
  [VerificationEvents.verification_complete]: undefined
  [VerificationEvents.verification_error]: {
    error: string
  }
  [VerificationEvents.verification_cancel]: undefined
  [VerificationEvents.verification_timeout]: undefined

  [VerificationEvents.verification_hash_retrieved]: {
    phoneHash: string
    address: string
  }
  [VerificationEvents.verification_fetch_status_start]: undefined
  [VerificationEvents.verification_fetch_status_complete]: {
    isVerified: boolean
    numAttestationsRemaining: number
    total: number
    completed: number
  }

  [VerificationEvents.verification_request_all_attestations_start]: {
    attestationsToRequest: number
  }
  [VerificationEvents.verification_request_all_attestations_refresh_progress]: {
    attestationsRemaining: number
  }
  [VerificationEvents.verification_request_all_attestations_complete]: {
    issuers: string[]
  }

  [VerificationEvents.verification_request_attestation_start]: {
    currentAttestation: number
  }
  [VerificationEvents.verification_request_attestation_approve_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_request_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_await_issuer_selection]: undefined
  [VerificationEvents.verification_request_attestation_select_issuer]: undefined
  [VerificationEvents.verification_request_attestation_issuer_tx_sent]: undefined
  [VerificationEvents.verification_request_attestation_complete]: undefined

  [VerificationEvents.verification_code_received]:
    | undefined
    | {
        context: string
      }
  [VerificationEvents.verification_code_validate_start]: {
    issuer: any
  }
  [VerificationEvents.verification_code_validate_complete]: {
    issuer: any
  }

  [VerificationEvents.verification_reveal_all_attestations_start]: undefined
  [VerificationEvents.verification_reveal_attestation_revealed]: {
    issuer: any
    neededRetry: boolean
  }
  [VerificationEvents.verification_reveal_attestation_await_code_start]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_all_attestations_complete]: undefined

  [VerificationEvents.verification_reveal_attestation_start]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_await_code_complete]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_complete]: {
    issuer: any
  }
  [VerificationEvents.verification_reveal_attestation_error]: {
    issuer: any
    error: string
  }
  [VerificationEvents.verification_reveal_attestation_status]: {
    success: boolean
    identifier: string
    account: string
    issuer: string
    attempt: number
    countryCode: string
    status: string
    provider: string
    duration: number
    errors: any
  }
  [VerificationEvents.verification_revoke_start]: undefined
  [VerificationEvents.verification_revoke_finish]: undefined
  [VerificationEvents.verification_revoke_error]: {
    error: string
  }
  [VerificationEvents.verification_resend_messages]: {
    count: number
  }
}

interface IdentityEventsProperties {
  [IdentityEvents.contacts_connect]: {
    matchMakingEnabled: boolean
  }
  [IdentityEvents.contacts_import_permission_denied]: undefined
  [IdentityEvents.contacts_import_start]: undefined
  [IdentityEvents.contacts_import_complete]: {
    contactImportCount: number
  }
  [IdentityEvents.contacts_processing_complete]: undefined
  [IdentityEvents.contacts_matchmaking_complete]: {
    matchCount: number
  }
  [IdentityEvents.contacts_import_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_start]: undefined
  [IdentityEvents.phone_number_lookup_complete]: undefined
  [IdentityEvents.phone_number_lookup_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_purchase_complete]: undefined
  [IdentityEvents.phone_number_lookup_purchase_error]: {
    error: string
  }
  [IdentityEvents.phone_number_lookup_purchase_skip]: undefined
}

interface InviteEventsProperties {
  [InviteEvents.invite_tx_start]: {
    escrowIncluded: boolean
  }
  [InviteEvents.invite_tx_complete]: {
    escrowIncluded: boolean
  }
  [InviteEvents.invite_tx_error]: {
    escrowIncluded: boolean
    error: string
  }
  [InviteEvents.invite_method_sms]: undefined
  [InviteEvents.invite_method_whatsapp]: undefined
  [InviteEvents.invite_method_error]: {
    error: string
  }
}

interface EscrowEventsProperties {
  [EscrowEvents.escrow_transfer_start]: undefined
  [EscrowEvents.escrow_transfer_approve_tx_sent]: undefined
  [EscrowEvents.escrow_transfer_transfer_tx_sent]: undefined
  [EscrowEvents.escrow_transfer_complete]: undefined
  [EscrowEvents.escrow_transfer_error]: {
    error: string
  }

  [EscrowEvents.escrow_fetch_start]: undefined
  [EscrowEvents.escrow_fetch_complete]: undefined
  [EscrowEvents.escrow_fetch_error]: {
    error: string
  }

  [EscrowEvents.escrow_reclaim_confirm]: undefined
  [EscrowEvents.escrow_reclaim_cancel]: undefined
  [EscrowEvents.escrow_reclaim_start]: undefined
  [EscrowEvents.escrow_reclaim_complete]: undefined
  [EscrowEvents.escrow_reclaim_error]: {
    error: string
  }
}

interface SendEventsProperties {
  [SendEvents.send_scan]: undefined
  [SendEvents.send_select_recipient]: {
    recipientKind: RecipientKind
    usedSearchBar: boolean
  }
  [SendEvents.send_cancel]: undefined
  [SendEvents.send_amount_back]: undefined
  [SendEvents.send_amount_continue]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [SendEvents.send_confirm_back]: undefined
  [SendEvents.send_confirm_send]: {
    isScan: boolean
    isInvite: boolean
    isRequest: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
    commentLength: number
  }

  [SendEvents.send_secure_start]: {
    confirmByScan: boolean
  }
  [SendEvents.send_secure_back]: undefined
  [SendEvents.send_secure_cancel]: undefined
  [SendEvents.send_secure_submit]: {
    partialAddressValidation: boolean
    address: string
  }
  [SendEvents.send_secure_complete]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
  }
  [SendEvents.send_secure_incorrect]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
    error: string
  }
  [SendEvents.send_secure_info]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_info_dismissed]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_edit]: undefined

  [SendEvents.send_tx_start]: undefined
  [SendEvents.send_tx_complete]: {
    txId: string
    recipientAddress: string
    amount: string
    currency: string
  }
  [SendEvents.send_tx_error]: {
    error: string
  }
}

interface RequestEventsProperties {
  [RequestEvents.request_amount_back]: undefined
  [RequestEvents.request_cancel]: undefined
  [RequestEvents.request_scan]: undefined
  [RequestEvents.request_select_recipient]: {
    recipientKind: RecipientKind
    usedSearchBar: boolean
  }
  [RequestEvents.request_amount_continue]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [RequestEvents.request_unavailable]: {
    isScan: boolean
    isInvite: boolean
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: string | null
    localCurrencyAmount: string | null
  }
  [RequestEvents.request_confirm_back]: undefined
  [RequestEvents.request_confirm_request]: {
    requesteeAddress: string
  }
  [RequestEvents.request_error]: {
    error: string
  }
}

interface FeeEventsProperties {
  [FeeEvents.fee_rendered]: {
    feeType: string
    fee?: string
  }
  [FeeEvents.estimate_fee_failed]: {
    feeType: string
    error: string
  }
  [FeeEvents.fetch_tobin_tax_failed]: {
    error: string
  }
}

interface TransactionEventsProperties {
  [TransactionEvents.transaction_start]: {
    txId: string
    description?: string
    fornoMode?: boolean
  }
  [TransactionEvents.transaction_gas_estimated]: {
    txId: string
    estimatedGas: number
  }
  [TransactionEvents.transaction_hash_received]: {
    txId: string
    txHash: string
  }
  [TransactionEvents.transaction_confirmed]: {
    txId: string
  }
  [TransactionEvents.transaction_receipt_received]: {
    txId: string
  }
  [TransactionEvents.transaction_error]: {
    txId: string
    error: string
  }
  [TransactionEvents.transaction_exception]: {
    txId: string
    error: string
  }
}

interface CeloExchangeEventsProperties {
  [CeloExchangeEvents.celo_home_info]: undefined
  [CeloExchangeEvents.celo_home_buy]: undefined
  [CeloExchangeEvents.celo_home_sell]: undefined
  [CeloExchangeEvents.celo_home_withdraw]: undefined
  [CeloExchangeEvents.celo_transaction_select]: undefined
  [CeloExchangeEvents.celo_transaction_back]: undefined

  [CeloExchangeEvents.celo_toggle_input_currency]: {
    to: CURRENCY_ENUM
  }
  [CeloExchangeEvents.celo_buy_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.celo_buy_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    dollarAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.celo_buy_cancel]: undefined
  [CeloExchangeEvents.celo_buy_edit]: undefined
  [CeloExchangeEvents.celo_buy_error]: {
    error: string
  }
  [CeloExchangeEvents.celo_sell_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.celo_sell_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    dollarAmount: string
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: string
  }
  [CeloExchangeEvents.celo_sell_cancel]: undefined
  [CeloExchangeEvents.celo_sell_edit]: undefined
  [CeloExchangeEvents.celo_sell_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_exchange_start]: undefined
  [CeloExchangeEvents.celo_exchange_complete]: {
    txId: string
    currency: string
    amount: string
  }
  [CeloExchangeEvents.celo_exchange_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_fetch_exchange_rate_start]: undefined
  [CeloExchangeEvents.celo_fetch_exchange_rate_complete]: {
    makerAmount: number
    exchangeRate: number
  }
  [CeloExchangeEvents.celo_fetch_exchange_rate_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_withdraw_review]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_edit]: undefined
  [CeloExchangeEvents.celo_withdraw_cancel]: undefined
  [CeloExchangeEvents.celo_withdraw_confirm]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_completed]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_error]: {
    error: string
  }
}

interface FiatExchangeEventsProperties {
  [FiatExchangeEvents.external_exchange_link]: {
    name: string
    link: string
  }
}

interface GethEventsProperties {
  [GethEvents.blockchain_corruption]: undefined
  [GethEvents.geth_init_success]: undefined
  [GethEvents.geth_init_failure]: {
    error: string
    context: string
  }
  [GethEvents.geth_restart_to_fix_init]: undefined
  [GethEvents.prompt_forno]: {
    error?: string
    context: string
  }
  [GethEvents.geth_init_start]: {
    shouldStartNode: boolean
  }
  [GethEvents.create_geth_start]: undefined
  [GethEvents.create_geth_finish]: undefined
  [GethEvents.create_geth_error]: {
    error: string
  }
  [GethEvents.start_geth_start]: undefined
  [GethEvents.start_geth_finish]: undefined
}

interface NetworkEventsProperties {
  [NetworkEvents.network_connected]: {
    fornoMode: boolean
  }
  [NetworkEvents.network_disconnected]: {
    fornoMode: boolean
  }
  [NetworkEvents.network_sync_lost]: {
    latestBlock: number
    latestTimestamp: number
  }
  [NetworkEvents.network_sync_restored]: {
    latestBlock: number
    latestTimestamp: number
  }
  [NetworkEvents.network_sync_waiting]: {
    latestBlock?: number
  }
  [NetworkEvents.network_sync_start]: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
  }
  [NetworkEvents.network_sync_finish]: {
    latestBlock: number
  }
  [NetworkEvents.network_sync_error]: {
    error: string
  }
}

interface ContractKitEventsProperties {
  [ContractKitEvents.init_contractkit_start]: undefined
  [ContractKitEvents.init_contractkit_geth_init_start]: {
    retries: number
  }
  [ContractKitEvents.init_contractkit_geth_init_finish]: undefined
  [ContractKitEvents.init_contractkit_get_ipc_start]: undefined
  [ContractKitEvents.init_contractkit_get_ipc_finish]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_start]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_init_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_finish]: undefined
}

export type AnalyticsPropertiesList = AppEventsProperties &
  HomeEventsProperties &
  SettingsEventsProperties &
  OnboardingEventsProperties &
  VerificationEventsProperties &
  IdentityEventsProperties &
  IdentityEventsProperties &
  InviteEventsProperties &
  SendEventsProperties &
  EscrowEventsProperties &
  RequestEventsProperties &
  FeeEventsProperties &
  TransactionEventsProperties &
  CeloExchangeEventsProperties &
  FiatExchangeEventsProperties &
  GethEventsProperties &
  NetworkEventsProperties &
  ContractKitEventsProperties
