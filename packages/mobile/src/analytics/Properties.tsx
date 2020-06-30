import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  CeloExchangeEvents,
  ContactImportEvents,
  EscrowEvents,
  FeeEvents,
  GethEvents,
  InviteEvents,
  NotificationEvents,
  OnboardingEvents,
  RequestEvents,
  SendEvents,
  SettingsEvents,
  TransactionEvents,
  VerificationEvents,
} from 'src/analytics/Events'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { RecipientKind } from 'src/recipients/recipient'

interface AppEventsProperties {
  [AppEvents.app_launched]: {
    loadingDuration: number
    deviceInfo?: object
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.error_boundary]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: BigNumber
    goldBalance?: BigNumber
  }
}

interface SettingsEventsProperties {
  [SettingsEvents.edit_profile]: undefined
  [SettingsEvents.edit_name]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }
}

interface NotificationEventsProperties {
  [NotificationEvents.celogold_notification_confirm]: undefined
  [NotificationEvents.celogold_notification_dismiss]: undefined
  [NotificationEvents.celorewards_notification_confirm]: undefined
  [NotificationEvents.celorewards_notification_dismiss]: undefined
  [NotificationEvents.invitefriends_notification_confirm]: undefined
  [NotificationEvents.invitefriends_notification_dismiss]: undefined
  [NotificationEvents.incoming_request_payment_decline]: undefined
  [NotificationEvents.incoming_request_payment_pay]: undefined
  [NotificationEvents.incoming_request_payment_review]: undefined
  [NotificationEvents.outgoing_request_payment_review]: undefined
  [NotificationEvents.outgoing_request_payment_remind]: undefined
  [NotificationEvents.outgoing_request_payment_cancel]: undefined
  [NotificationEvents.clicked_escrowed_payment_notification]: undefined
  [NotificationEvents.clicked_escrowed_payment_send_message]: undefined
  [NotificationEvents.get_backup_key]: undefined
}

interface OnboardingEventsProperties {
  [OnboardingEvents.backup_educate_1_next]: undefined
  [OnboardingEvents.backup_educate_2_next]: undefined
  [OnboardingEvents.backup_educate_3_next]: undefined
  [OnboardingEvents.backup_educate_4_next]: undefined

  [OnboardingEvents.backup_educate_1_cancel]: {
    screen: string
  }
  [OnboardingEvents.backup_educate_2_cancel]: {
    screen: string
  }
  [OnboardingEvents.backup_educate_3_cancel]: {
    screen: string
  }
  [OnboardingEvents.backup_educate_4_cancel]: {
    screen: string
  }

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_setup_info]: undefined
  [OnboardingEvents.backup_quiz_backspace]: undefined
  [OnboardingEvents.backup_quiz_start]: undefined
  [OnboardingEvents.backup_quiz_submit]: undefined
  [OnboardingEvents.backup_quiz_success]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.delay_backup]: undefined
  [OnboardingEvents.backup_cancel]: {
    screen: string
  }
  [OnboardingEvents.backup_cancel_procrastinate]: {
    screen: string
    title: string
  }
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_setup_toggle_enable]: undefined
  [OnboardingEvents.backup_setup_toggle_disable]: undefined
  [OnboardingEvents.backup_error]: {
    title: string
    context?: string
  }

  [OnboardingEvents.gold_educate_1_next]: undefined
  [OnboardingEvents.gold_educate_2_next]: undefined
  [OnboardingEvents.gold_educate_3_next]: undefined

  [OnboardingEvents.exchange_gold_nux]: undefined

  [OnboardingEvents.gold_cancel1]: {
    screen: string
  }
  [OnboardingEvents.gold_cancel2]: {
    screen: string
  }
  [OnboardingEvents.gold_cancel3]: {
    screen: string
  }

  [OnboardingEvents.phone_number_set]: {
    countryCode: string
  }
  [OnboardingEvents.invalid_phone_number]: {
    obfuscatedPhoneNumber: string
  }
  [OnboardingEvents.pin_created]: undefined
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: {
    pincodeType: PincodeType
  }
  [OnboardingEvents.import_wallet_submit]: undefined
}

interface VerificationEventsProperties {
  [VerificationEvents.verification_start]: undefined
  [VerificationEvents.verification_hash_retrieved]: {
    phoneHash: string
    address: string
  }
  [VerificationEvents.verification_setup]: undefined
  [VerificationEvents.verification_get_status]: {
    isVerified: boolean
    numAttestationsRemaining: number
    total: number
    completed: number
  }
  [VerificationEvents.verification_request_attestations]: {
    numAttestationsRequestsNeeded: number
  }
  [VerificationEvents.verification_wait_for_select_issuers]: undefined
  [VerificationEvents.verification_selecting_issuer]: undefined
  [VerificationEvents.verification_requested_attestations]: undefined
  [VerificationEvents.verification_set_account]: {
    address: string
  }
  [VerificationEvents.verification_reveal_attestation]: {
    issuer: any
  }
  [VerificationEvents.verification_revealed_attestation]: {
    issuer: any
    duration: number
  }
  [VerificationEvents.verification_reveal_error]: {
    issuer: any
    statusCode: any
  }
  [VerificationEvents.verification_wait_for_attestation_code]: {
    issuer: any
  }
  [VerificationEvents.verification_code_received]:
    | undefined
    | {
        context: string
      }
  [VerificationEvents.verification_complete_attestation]: {
    issuer: any
  }
  [VerificationEvents.verification_completed_attestation]: {
    issuer: any
  }
  [VerificationEvents.verification_failed]: {
    duration: number
  }
  [VerificationEvents.verification_cancelled]: {
    duration: number
  }
  [VerificationEvents.verification_success]: {
    duration: number
  }
  [VerificationEvents.verification_timed_out]: {
    duration: number
  }
  [VerificationEvents.verification_error]: {
    error: string
  }
  [VerificationEvents.verification_actionable_attestation_start]: undefined
  [VerificationEvents.verification_actionable_attestation_finish]: {
    duration: number
  }
  [VerificationEvents.verification_validate_code_start]: {
    issuer: any
  }
  [VerificationEvents.verification_validate_code_finish]: {
    issuer: any
  }
  [VerificationEvents.phone_number_quota_purchase_success]: undefined
  [VerificationEvents.phone_number_quota_purchase_failure]: {
    error: string
  }
  [VerificationEvents.phone_number_quota_purchase_skip]: undefined
}

interface ContactImportEventsProperties {
  [ContactImportEvents.import_contacts]: undefined
  [ContactImportEvents.import_contact_error]: {
    error: string
  }
  [ContactImportEvents.fetched_contacts]: {
    contacts: number
  }
  [ContactImportEvents.add_contact_match]: {
    contactsMatched: number
  }
}

interface InviteEventsProperties {
  [InviteEvents.invite_success]: undefined
  [InviteEvents.invite_error]: {
    error: string
  }
  [InviteEvents.friend_invited]: undefined
  [InviteEvents.invite_edit]: undefined
  [InviteEvents.invite_friends_sms]: undefined
  [InviteEvents.invite_friends_whatsapp]: undefined
  [InviteEvents.invite_skip_failed]: {
    error: string
  }
  [InviteEvents.invite_skip_complete]: undefined
  [InviteEvents.redeem_invite_success]: undefined
  [InviteEvents.redeem_invite_timed_out]: undefined
  [InviteEvents.redeem_invite_failed]: {
    error: string
  }
}

interface SendEventsProperties {
  [SendEvents.send_cancel]: undefined
  [SendEvents.send_scan]: undefined
  [SendEvents.send_select_recipient]: {
    recipientKind: RecipientKind
    method: 'used search bar' | 'selected from list'
  }
  [SendEvents.send_amount_back]: undefined
  [SendEvents.send_continue]: {
    method: 'scan' | 'search'
    transactionType: 'send' | 'invite'
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: BigNumber | null
    localCurrencyAmount: BigNumber | null
  }
  [SendEvents.send_confirm_back]: undefined
  [SendEvents.send_confirm]: {
    method: 'scan' | 'search'
    transactionType: 'send' | 'invite'
    localCurrencyExchangeRate?: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: BigNumber | null
    localCurrencyAmount: BigNumber | null
  }
  [SendEvents.send_error]: {
    isInvite: boolean
    error: string
  }
  [SendEvents.send_complete]: {
    isInvite: boolean
  }
  [SendEvents.send_dollar_transaction]: undefined
  [SendEvents.send_dollar_transaction_confirmed]: undefined

  [SendEvents.send_secure_start]: {
    method: 'scan' | 'manual'
  }
  [SendEvents.send_secure_cancel]: undefined
  [SendEvents.send_secure_back]: undefined
  [SendEvents.send_secure_submit]: {
    validationType: 'full' | 'partial'
    address: string
  }
  [SendEvents.send_secure_success]: {
    method: 'scan' | 'manual'
    validationType?: 'full' | 'partial'
  }
  [SendEvents.send_secure_incorrect]: {
    method: 'scan' | 'manual'
    validationType?: 'full' | 'partial'
    error: string
  }
  [SendEvents.send_secure_info]: {
    validationType: 'full' | 'partial'
  }
  [SendEvents.send_secure_info_dismissed]: {
    validationType: 'full' | 'partial'
  }
  [SendEvents.send_secure_edit]: undefined
}

interface EscrowEventsProperties {
  [EscrowEvents.escrowed_payment_review]: undefined
  [EscrowEvents.escrow_transfer]: undefined
  [EscrowEvents.escrowed_payment_reclaimed_by_sender]: undefined
  [EscrowEvents.escrowed_payment_reclaimEdit_by_sender]: undefined
  [EscrowEvents.escrowed_payment_withdrawn_by_receiver]: undefined
  [EscrowEvents.escrow_failed_to_withdraw]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_reclaim]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_transfer]: {
    error: string
  }
  [EscrowEvents.escrow_failed_to_fetch_sent]: {
    error: string
  }
}

interface RequestEventsProperties {
  [RequestEvents.request_amount_back]: undefined
  [RequestEvents.request_cancel]: undefined
  [RequestEvents.request_scan]: undefined
  [RequestEvents.request_select_recipient]: {
    recipientKind: RecipientKind
    method: 'used search bar' | 'selected from list'
  }
  [RequestEvents.request_continue]: {
    method: 'scan' | 'search'
    transactionType: 'send' | 'invite'
    localCurrencyExchangeRate: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: BigNumber | null
    localCurrencyAmount: BigNumber | null
  }
  [RequestEvents.request_unavailable]: {
    method: 'scan' | 'search'
    transactionType: 'send' | 'invite'
    localCurrencyExchangeRate: string | null
    localCurrency: LocalCurrencyCode
    dollarAmount: BigNumber | null
    localCurrencyAmount: BigNumber | null
  }
  [RequestEvents.request_confirm_back]: undefined
  [RequestEvents.request_confirm]: {
    requesteeAddress: string
  }
  [RequestEvents.request_error]: {
    error: string
  }
}

interface FeeEventsProperties {
  [FeeEvents.fee_rendered]: {
    feeType: string
    fee?: BigNumber
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
  [TransactionEvents.transaction_send_start]: {
    txId: string
  }
  [TransactionEvents.transaction_send_gas_estimated]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_send_gas_hash_received]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_send_gas_receipt]: {
    txId: string
    duration: number
  }
  [TransactionEvents.transaction_error]: {
    txId: string
    duration: number
    error: string
  }
  [TransactionEvents.transaction_exception]: {
    txId: string
    duration: number
    error: string
  }
  [TransactionEvents.transfer_token_error]: {
    error: string
  }
  [TransactionEvents.unexpected_maker_token]: {
    makerToken: CURRENCY_ENUM
  }
}

interface CeloExchangeEventsProperties {
  [CeloExchangeEvents.gold_switch_input_currency]: {
    to: CURRENCY_ENUM
  }
  [CeloExchangeEvents.gold_buy_continue]: {
    localCurrencyAmount: BigNumber | null
    goldAmount: BigNumber
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: BigNumber
  }
  [CeloExchangeEvents.gold_buy_confirm]: {
    localCurrencyAmount: BigNumber | null
    goldAmount: BigNumber
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: BigNumber
  }
  [CeloExchangeEvents.gold_buy_cancel]: undefined
  [CeloExchangeEvents.gold_buy_edit]: undefined
  [CeloExchangeEvents.gold_buy_error]: {
    error: string
  }
  [CeloExchangeEvents.gold_sell_continue]: {
    localCurrencyAmount: BigNumber | null
    goldAmount: BigNumber
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: BigNumber
  }
  [CeloExchangeEvents.gold_sell_confirm]: {
    localCurrencyAmount: BigNumber | null
    goldAmount: BigNumber
    inputToken: CURRENCY_ENUM
    goldToDollarExchangeRate: BigNumber
  }
  [CeloExchangeEvents.gold_sell_cancel]: undefined
  [CeloExchangeEvents.gold_sell_edit]: undefined
  [CeloExchangeEvents.gold_sell_error]: {
    error: string
  }

  [CeloExchangeEvents.fetch_exchange_rate_failed]: {
    error: string
  }
  [CeloExchangeEvents.invalid_exchange_rate]: {
    exchangeRate: BigNumber
  }
  [CeloExchangeEvents.exchange_rate_change_failure]: {
    makerToken: CURRENCY_ENUM
    takerAmount: BigNumber
    context: string
  }
  [CeloExchangeEvents.missing_tx_id]: undefined
  [CeloExchangeEvents.exchange_failed]: {
    error: string
  }
  [CeloExchangeEvents.gold_info]: undefined
  [CeloExchangeEvents.gold_buy_start]: undefined
  [CeloExchangeEvents.gold_sell_start]: undefined
  [CeloExchangeEvents.gold_activity_select]: undefined
  [CeloExchangeEvents.gold_activity_back]: undefined
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
    error: string
    context: string
  }
}

export type AnalyticsPropertiesList = AppEventsProperties &
  SettingsEventsProperties &
  NotificationEventsProperties &
  OnboardingEventsProperties &
  VerificationEventsProperties &
  ContactImportEventsProperties &
  InviteEventsProperties &
  SendEventsProperties &
  EscrowEventsProperties &
  RequestEventsProperties &
  FeeEventsProperties &
  TransactionEventsProperties &
  CeloExchangeEventsProperties &
  GethEventsProperties
