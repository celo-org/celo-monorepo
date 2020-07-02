export enum AppEvents {
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  error_boundary = 'error_boundary',
  user_restart = 'user_restart',
  fetch_balance = 'fetch_balance',
}

export enum SettingsEvents {
  edit_profile = 'edit_profile', // to count the # of taps on the edit profile button in Account_Home
  edit_name = 'edit_name', // to count the # of taps on the “Edit Name” nav element in Account_Edit
  language_select = 'language_select',
}

export enum NotificationEvents {
  notification_scroll = 'notification_scroll',
  notification_select = 'notification_select',
}

export enum OnboardingEvents {
  backup_education_start = 'backup_education_start',
  backup_education_scroll = 'backup_education_scroll',
  backup_education_complete = 'backup_education_complete',
  backup_education_cancel = 'backup_education_cancel',

  backup_start = 'backup_start',
  backup_continue = 'backup_continue', // (count # of taps on “Continue” button in Backup_Phrase)
  backup_complete = 'backup_complete', // (count # of taps on "Cancel" button in Backup_Phrase/BackupQuiz)
  backup_more_info = 'backup_more_info',
  backup_delay = 'backup_delay', // when a user delays backup seed phrase completion
  backup_delay_confirm = 'backup_delay_confirm', // when a user confirms they want to delay backup
  backup_delay_cancel = 'backup_delay_cancel', // when a user decides to return to backup flow
  backup_cancel = 'backup_cancel', // (count # of taps on "Cancel" button in Backup_Phrase/BackupQuiz)
  backup_error = 'backup_error',

  backup_quiz_start = 'backup_quiz_start',
  backup_quiz_progress = 'backup_quiz_progress', // whenever the backspace is pressed or word is chosen
  backup_quiz_complete = 'backup_quiz_complete', // (Count # of successful Account Key confirmations Backup_Quiz)
  backup_quiz_incorrect = 'backup_quiz_incorrect', // (Count # of failed Account Key confirmations Backup_Quiz)

  celo_education_start = 'celo_education_start',
  celo_education_scroll = 'celo_education_scroll',
  celo_education_complete = 'celo_education_complete',
  celo_education_cancel = 'celo_education_cancel',

  phone_number_set = 'phone_number_set',
  phone_number_invalid = 'phone_number_invalid',

  pin_set = 'pin_set',
  pin_invalid = 'pin_invalid',
  pin_failed_to_set = 'pin_failed_to_set',
  pin_never_set = 'pin_never_set',

  wallet_import_start = 'wallet_import_start',
  wallet_import_complete = 'wallet_import_complete',
  wallet_import_cancel = 'wallet_import_cancel', // when a user cancels import of 0 balance wallet

  invite_redeem_start = 'invite_redeem_start',
  invite_redeem_complete = 'invite_redeem_complete',
  invite_redeem_timeout = 'invite_redeem_timeout',
  invite_redeem_error = 'invite_redeem_error',

  invite_redeem_skip_start = 'invite_redeem_skip_start',
  invite_redeem_skip_complete = 'invite_redeem_skip_complete',
  invite_redeem_skip_error = 'invite_redeem_skip_error',

  escrow_redeem_start = 'escrow_redeem_start', // when escrow redemption starts (only happens on user invite redeemption)
  escrow_redeem_complete = 'escrow_redeem_complete',
  escrow_redeem_error = 'escrow_redeem_error',
}

export enum VerificationEvents {
  verification_start = 'verification_start',
  verification_complete = 'verification_complete',
  verification_error = 'verification_error',
  verification_cancel = 'verification_cancel',
  verification_timeout = 'verification_timeout',

  verification_hash_retrieved = 'verification_hash_retrieved',
  verification_fetch_status_start = 'verification_fetch_status_start',
  verification_fetch_status_complete = 'verification_fetch_status_complete',

  verification_request_all_attestations_start = 'verification_request_all_attestations_start',
  verification_request_all_attestations_refresh_progress = 'verification_request_all_attestations_refresh_progress',
  verification_request_all_attestations_complete = 'verification_request_all_attestations_complete',

  // Events for an individual attestation
  verification_request_attestation_start = 'verification_request_attestation_start',
  verification_request_attestation_approve_tx_sent = 'verification_request_attestation_approve_tx_sent',
  verification_request_attestation_request_tx_sent = 'verification_request_attestation_request_tx_sent',
  verification_request_attestation_await_issuer_selection = 'verification_request_attestation_await_issuer_selection',
  verification_request_attestation_select_issuer = 'verification_request_attestation_select_issuer',
  verification_request_attestation_issuer_tx_sent = 'verification_request_attestation_issuer_tx_sent',
  verification_request_attestation_complete = 'verification_request_attestation_complete',

  verification_code_received = 'verification_code_received',
  verification_code_validate_start = 'verification_code_validate_start',
  verification_code_validate_complete = 'verification_code_validate_complete',
  verification_account_set = 'verification_account_set',

  verification_reveal_all_attestations_start = 'verification_reveal_all_attestations_start',
  verification_reveal_all_attestations_complete = 'verification_reveal_all_attestations_complete',

  // Events for an individual attestation reveal
  verification_reveal_attestation_start = 'verification_reveal_attestation_start',
  verification_reveal_attestation_revealed = 'verification_reveal_attestation_revealed',
  verification_reveal_attestation_await_code_start = 'verification_reveal_attestation_await_code_start',
  verification_reveal_attestation_await_code_complete = 'verification_reveal_attestation_await_code_complete',
  verification_reveal_attestation_complete = 'verification_reveal_attestation_complete',
  verification_reveal_attestation_error = 'verification_reveal_attestation_error',
}

export enum IdentityEvents {
  contacts_connect = 'contacts_connect', // when connect button is pressed
  contacts_import_permission_denied = 'contacts_import_permission_denied',
  contacts_import_start = 'contacts_import_start',
  contacts_import_complete = 'contacts_import_complete',
  contacts_processing_complete = 'contacts_processing_complete',
  contacts_matchmaking_complete = 'contacts_matchmaking_complete',
  contacts_import_error = 'contacts_import_error',

  phone_number_lookup_start = 'phone_number_lookup_start',
  phone_number_lookup_complete = 'phone_number_lookup_complete',
  phone_number_lookup_error = 'phone_number_lookup_error',

  phone_number_lookup_purchase_complete = 'phone_number_lookup_purchase_complete',
  phone_number_lookup_purchase_error = 'phone_number_lookup_purchase_error',
  phone_number_lookup_purchase_skip = 'phone_number_lookup_purchase_skip',
}

export enum InviteEvents {
  invite_tx_start = 'invite_tx_start',
  invite_tx_complete = 'invite_tx_complete',
  invite_tx_error = 'invite_tx_error',
  invite_method_sms = 'invite_method_sms',
  invite_method_whatsapp = 'invite_method_whatsapp',
  invite_method_error = 'invite_method_error',
}

export enum EscrowEvents {
  escrow_transfer_start = 'escrow_transfer_start',
  escrow_transfer_approve_tx_sent = 'escrow_transfer_approve_tx_sent',
  escrow_transfer_transfer_tx_sent = 'escrow_transfer_transfer_tx_sent',
  escrow_transfer_complete = 'escrow_transfer_complete',
  escrow_transfer_error = 'escrow_transfer_error',

  escrow_fetch_start = 'escrow_fetch_start',
  escrow_fetch_complete = 'escrow_fetch_complete',
  escrow_fetch_error = 'escrow_fetch_error',

  escrow_reclaim_confirm = 'escrow_reclaim_confirm', // user confirms they want to reclaim escrowed payment
  escrow_reclaim_cancel = 'escrow_reclaim_cancel', // user decides not to initiate a reclaim of escrowed payment
  escrow_reclaim_start = 'escrow_reclaim_start', // when reclaim transaction starts
  escrow_reclaim_complete = 'escrow_reclaim_complete', // when reclaim transaction complete
  escrow_reclaim_error = 'escrow_reclaim_error',
}

export enum SendEvents {
  send_cancel = 'send_cancel', // when cancel is clicked after launching send flow
  send_scan = 'send_scan', // when scan QR icon is selected from the send screen
  send_select_recipient = 'send_select_recipient', // when recipient was selected
  send_amount_back = 'send_amount_back', // back button pressed on amount screen
  send_continue = 'send_continue', // when next button pressed on amount enter page
  send_confirm_back = 'send_confirm_back', // when back button pressed on send confirmation screen
  send_confirm = 'send_confirm', // when send button pressed on send confirmation screen
  send_error = 'send_error', // when there is an error sending a transaction
  send_complete = 'send_complete', // when a send or invite transaction has successfully completed

  send_secure_start = 'send_secure_start', // when either secure send scan or manual confirm button pressed
  send_secure_cancel = 'send_secure_cancel', // when secure send flow is canceled
  send_secure_back = 'send_secure_back', // when back button is pressed during secure send
  send_secure_submit = 'send_secure_submit', // when an account is submitted for validation
  send_secure_success = 'send_secure_success', // when an account has been validated
  send_secure_incorrect = 'send_secure_incorrect', // when there's been an error validating the account
  send_secure_info = 'send_secure_info', // when "help" button is pressed
  send_secure_info_dismissed = 'send_secure_info_dismissed', // when "help" button is dismissed
  send_secure_edit = 'send_secure_edit', // when "edit" address button is pressed to manually initate secure send flow

  send_dollar_transaction = 'send_dollar_transaction',
  send_dollar_transaction_confirmed = 'send_dollar_transaction_confirmed',
}

export enum RequestEvents {
  request_amount_back = 'request_amount_back', // back button pressed on amount screen
  request_cancel = 'request_cancel', // when cancel is clicked after launching request flow
  request_scan = 'request_scan', // when scan QR icon is selected from the request screen
  request_select_recipient = 'request_select_recipient', // when recipient was selected
  request_continue = 'request_continue', // when next button pressed on amount enter page
  request_unavailable = 'request_unavailable', // when request attempted to unverified user
  request_confirm_back = 'request_confirm_back', // when back button pressed on request confirmation screen
  request_confirm = 'request_confirm', // when request button pressed on request confirmation screen
  request_error = 'request_error', // when there is an error requesting a transaction
}

export enum FeeEvents {
  fee_rendered = 'fee_rendered',
  estimate_fee_failed = 'estimate_fee_failed',
  fetch_tobin_tax_failed = 'fetch_tobin_tax_failed',
}

export enum TransactionEvents {
  transaction_send_start = 'transaction_send_start',
  transaction_send_gas_estimated = 'transaction_send_gas_estimated',
  transaction_send_gas_hash_received = 'transaction_send_gas_hash_received',
  transaction_send_gas_receipt = 'transaction_send_gas_receipt',
  transaction_error = 'transaction_error',
  transaction_exception = 'transaction_exception',
  transfer_token_error = 'transfer_token_error',
  unexpected_maker_token = 'unexpected_maker_token',
}

export enum CeloExchangeEvents {
  // Gold Buy and Sell screens
  gold_switch_input_currency = 'gold_switch_input_currency', // when ‘switch to gold’ button pressed
  gold_buy_continue = 'gold_buy_continue', // when ‘review’ button clicked
  gold_buy_confirm = 'gold_buy_confirm', // when ‘buy’ button clicked
  gold_buy_cancel = 'gold_buy_cancel', // when ‘cancel’ is clicked
  gold_buy_edit = 'gold_buy_edit', // when ‘edit’ is clicked
  gold_buy_error = 'gold_buy_error', // error in send flow
  gold_sell_continue = 'gold_sell_continue', // when ‘review’ button clicked
  gold_sell_confirm = 'gold_sell_confirm', // when ‘sell’ button clicked
  gold_sell_cancel = 'gold_sell_cancel', // when ‘cancel’ is clicked
  gold_sell_edit = 'gold_sell_edit', // when ‘edit’ is clicked
  gold_sell_error = 'gold_sell_error', // error in sell flow

  // Exchange errors
  fetch_exchange_rate_failed = 'fetch_exchange_rate_failed',
  invalid_exchange_rate = 'invalid_exchange_rate',
  exchange_rate_change_failure = 'exchange_rate_change_failure',
  missing_tx_id = 'missing_tx_id',
  exchange_failed = 'exchange_failed',

  // Gold Home screen
  gold_info = 'gold_info', // when the (i) next to Celo Gold price is clicked, launching education (not pictured)
  gold_buy_start = 'gold_buy_start', // when the “Buy” button is clicked
  gold_sell_start = 'gold_sell_start', // when the “Sell” button is clicked
  gold_activity_select = 'gold_activity_select', // when an activity item is clicked
  gold_activity_back = 'gold_activity_back', // when back caret is clicked from drilldown
}

export enum GethEvents {
  blockchain_corruption = 'blockchain_corruption',
  geth_init_success = 'geth_init_success',
  geth_init_failure = 'geth_init_failure',
  geth_restart_to_fix_init = 'geth_restart_to_fix_init',
  prompt_forno = 'prompt_forno',
}

export const AnalyticsEvents = {
  ...AppEvents,
  ...SettingsEvents,
  ...NotificationEvents,
  ...OnboardingEvents,
  ...VerificationEvents,
  ...IdentityEvents,
  ...InviteEvents,
  ...EscrowEvents,
  ...SendEvents,
  ...RequestEvents,
  ...FeeEvents,
  ...TransactionEvents,
  ...CeloExchangeEvents,
  ...GethEvents,
}

export type AnalyticsEventType =
  | AppEvents
  | SettingsEvents
  | NotificationEvents
  | OnboardingEvents
  | VerificationEvents
  | IdentityEvents
  | InviteEvents
  | EscrowEvents
  | SendEvents
  | RequestEvents
  | FeeEvents
  | TransactionEvents
  | CeloExchangeEvents
  | GethEvents
