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
  wallet_import = 'wallet_import', // when a user attempts to import an existing wallet
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
  phone_number_lookup_purchase_complete = 'phone_number_lookup_purchase_complete',
  phone_number_lookup_purchase_error = 'phone_number_lookup_purchase_error',
  phone_number_lookup_purchase_skip = 'phone_number_lookup_purchase_skip',
}

export enum ContactImportEvents {
  contacts_connect = 'contacts_connect', // when connect button is pressed
  contacts_import_permission_denied = 'contacts_import_permission_denied',
  contacts_import_start = 'contacts_import_start',
  contacts_import_complete = 'contacts_import_complete',
  contacts_processing_complete = 'contacts_processing_complete',
  contacts_matchmaking_complete = 'contacts_matchmaking_complete',
  contacts_import_error = 'contacts_import_error',
}

export enum InviteEvents {
  invite_success = 'invite_success', // when there is an error sending an invite
  invite_error = 'invite_error', // when there is an error sending an invite
  friend_invited = 'friend_invited', // to record the name or number of the friend a user is inviting per an invite session
  invite_edit = 'invite_edit', // to count the # of taps on “Cancel” button at bottom of Invite_Friends_Review
  invite_friends_sms = 'invite_friends_sms', // to count the # of taps on “Invite with SMS" button on Invite_Friends_Review
  invite_friends_whatsapp = 'invite_friends_whatsapp', // to count the # of taps on “Invite with WhatsApp" button on Invite_Friends_Review
  invite_skip_failed = 'invite_skip_failed',
  invite_skip_complete = 'invite_skip_complete',

  redeem_invite_success = 'redeem_invite_success',
  redeem_invite_timed_out = 'redeem_invite_timed_out',
  redeem_invite_failed = 'redeem_invite_failed',
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

export enum EscrowEvents {
  escrowed_payment_review = 'escrowed_payment_review',
  escrow_transfer = 'escrow_transfer',
  escrowed_payment_reclaimed_by_sender = 'escrowed_payment_reclaimed_by_sender',
  escrowed_payment_reclaimEdit_by_sender = 'escrowed_payment_reclaimEdit_by_sender',
  escrowed_payment_withdrawn_by_receiver = 'escrowed_payment_withdrawn_by_receiver',
  escrow_failed_to_withdraw = 'escrow_failed_to_withdraw',
  escrow_failed_to_reclaim = 'escrow_failed_to_reclaim',
  escrow_failed_to_transfer = 'escrow_failed_to_transfer',
  escrow_failed_to_fetch_sent = 'escrow_failed_to_fetch_sent',
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
  ...ContactImportEvents,
  ...InviteEvents,
  ...SendEvents,
  ...EscrowEvents,
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
  | ContactImportEvents
  | InviteEvents
  | SendEvents
  | EscrowEvents
  | RequestEvents
  | FeeEvents
  | TransactionEvents
  | CeloExchangeEvents
  | GethEvents
