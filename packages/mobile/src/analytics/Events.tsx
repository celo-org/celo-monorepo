// TODO: TX feed + QR scanner + Geth

export enum AppEvents {
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  error_boundary = 'error_boundary',
  user_restart = 'user_restart',
  fetch_balance = 'fetch_balance',
}

export enum HomeEvents {
  home_send = 'home_send',
  home_request = 'home_request',
  home_qr = 'home_qr',
  drawer_navigation = 'drawer_navigation',
  drawer_address_copy = 'drawer_address_copy',
  notification_scroll = 'notification_scroll',
  notification_select = 'notification_select',
  transaction_feed_item_select = 'transaction_feed_item_select',
  transaction_feed_address_copy = 'transaction_feed_address_copy',
}

export enum SettingsEvents {
  settings_profile_edit = 'settings_profile_edit',
  settings_profile_name_edit = 'settings_profile_name_edit',
  settings_verify_number = 'settings_verify_number',
  language_select = 'language_select',
  pin_require_on_load = 'pin_require_on_load',
  forno_toggle = 'forno_toggle',
  licenses_view = 'licenses_view',
  tos_view = 'tos_view',
  start_account_removal = 'start_account_removal',
  completed_account_removal = 'completed_account_removal',
  // intentionally not tracking analytics opt in/out
  // to avoid tracking through omission
}

export enum OnboardingEvents {
  onboarding_education_start = 'onboarding_education_start',
  onboarding_education_scroll = 'onboarding_education_scroll',
  onboarding_education_complete = 'onboarding_education_complete',
  onboarding_education_cancel = 'onboarding_education_cancel',

  create_account_start = 'create_account_start',
  create_account_cancel = 'create_account_cancel',

  restore_account_start = 'create_account_start',
  restore_account_cancel = 'create_account_cancel',

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
  invite_redeem_cancel = 'invite_redeem_cancel',
  invite_redeem_timeout = 'invite_redeem_timeout',
  invite_redeem_error = 'invite_redeem_error',
  invite_redeem_move_funds_start = 'invite_redeem_move_funds_start',
  invite_redeem_move_funds_complete = 'invite_redeem_move_funds_complete',

  invite_redeem_skip_start = 'invite_redeem_skip_start',
  invite_redeem_skip_complete = 'invite_redeem_skip_complete',
  invite_redeem_skip_error = 'invite_redeem_skip_error',

  escrow_redeem_start = 'escrow_redeem_start', // when escrow redemption starts (only happens on user invite redeemption)
  escrow_redeem_complete = 'escrow_redeem_complete',
  escrow_redeem_error = 'escrow_redeem_error',

  account_dek_register_start = 'account_dek_register_start',
  account_dek_register_account_unlocked = 'account_dek_register_account_unlocked',
  account_dek_register_account_checked = 'account_dek_register_account_checked',
  account_dek_register_complete = 'account_dek_register_complete',
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

  verification_reveal_all_attestations_start = 'verification_reveal_all_attestations_start',
  verification_reveal_all_attestations_complete = 'verification_reveal_all_attestations_complete',

  // Events for an individual attestation reveal
  verification_reveal_attestation_start = 'verification_reveal_attestation_start',
  verification_reveal_attestation_revealed = 'verification_reveal_attestation_revealed',
  verification_reveal_attestation_await_code_start = 'verification_reveal_attestation_await_code_start',
  verification_reveal_attestation_await_code_complete = 'verification_reveal_attestation_await_code_complete',
  verification_reveal_attestation_complete = 'verification_reveal_attestation_complete',
  verification_reveal_attestation_error = 'verification_reveal_attestation_error',
  verification_reveal_attestation_status = 'verification_reveal_attestation_status',

  verification_revoke_start = 'verification_revoke_start',
  verification_revoke_finish = 'verification_revoke_finish',
  verification_revoke_error = 'verification_revoke_error',

  verification_resend_messages = 'verification_resend_messages',
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
  send_scan = 'send_scan', // when scan QR icon is selected from the send screen
  send_select_recipient = 'send_select_recipient', // when recipient was selected
  send_cancel = 'send_cancel', // when user x's out of Send screen
  send_amount_back = 'send_amount_back', // back button pressed on amount screen
  send_amount_continue = 'send_amount_continue', // when next button pressed on amount enter page
  send_confirm_back = 'send_confirm_back', // when back button pressed on send confirmation screen
  send_confirm_send = 'send_confirm_send', // when send button pressed on send confirmation screen

  send_secure_start = 'send_secure_start', // when either secure send scan or manual confirm button pressed
  send_secure_back = 'send_secure_back', // when back button is pressed during secure send
  send_secure_cancel = 'send_secure_cancel', // when secure send flow is canceled

  send_secure_info = 'send_secure_info', // when "help" button is pressed
  send_secure_info_dismissed = 'send_secure_info_dismissed', // when "help" button is dismissed
  send_secure_submit = 'send_secure_submit', // when an account is submitted for validation
  send_secure_incorrect = 'send_secure_incorrect', // when there's been an error validating the account
  send_secure_complete = 'send_secure_complete', // when an account has been validated

  send_secure_edit = 'send_secure_edit', // when "edit" address button is pressed to manually initate secure send flow

  send_tx_start = 'send_tx_start',
  send_tx_complete = 'send_tx_complete', // when a send or invite transaction has successfully completed
  send_tx_error = 'send_tx_error', // when there is an error sending a transaction
}

export enum RequestEvents {
  request_scan = 'request_scan', // when scan QR icon is selected from the request screen
  request_select_recipient = 'request_select_recipient', // when recipient was selected
  request_cancel = 'request_cancel', // when cancel is clicked after launching request flow
  request_amount_back = 'request_amount_back', // back button pressed on amount screen
  request_amount_continue = 'request_amount_continue', // when next button pressed on amount enter page
  request_unavailable = 'request_unavailable', // when request sender is unverified
  request_confirm_back = 'request_confirm_back', // when back button pressed on request confirmation screen
  request_confirm_request = 'request_confirm_request', // when request button pressed on request confirmation screen
  request_error = 'request_error', // when there is an error requesting a transaction
}

export enum FeeEvents {
  fee_rendered = 'fee_rendered',
  estimate_fee_failed = 'estimate_fee_failed',
  fetch_tobin_tax_failed = 'fetch_tobin_tax_failed',
}

// Generic transaction logging to grab tx hashs
export enum TransactionEvents {
  transaction_start = 'transaction_start',
  transaction_gas_estimated = 'transaction_gas_estimated',
  transaction_hash_received = 'transaction_hash_received',
  transaction_receipt_received = 'transaction_receipt_received',
  transaction_confirmed = 'transaction_confirmed',
  transaction_error = 'transaction_error',
  transaction_exception = 'transaction_exception',
}

export enum CeloExchangeEvents {
  celo_home_info = 'celo_home_info', // when the (i) next to Celo Gold price is clicked, launching education (not pictured)
  celo_home_buy = 'celo_home_buy', // when the “Buy” button is clicked
  celo_home_sell = 'celo_home_sell', // when the “Sell” button is clicked
  celo_home_withdraw = 'celo_home_withdraw', // when the “Withdraw” button is clicked
  celo_transaction_select = 'celo_transaction_select', // when an transaction item is clicked
  celo_transaction_back = 'celo_transaction_back', // when back caret is clicked from drilldown

  celo_toggle_input_currency = 'celo_toggle_input_currency', // when ‘switch to gold’ button pressed
  celo_buy_continue = 'celo_buy_continue', // when ‘review’ button clicked
  celo_buy_confirm = 'celo_buy_confirm', // when ‘buy’ button clicked
  celo_buy_cancel = 'celo_buy_cancel', // when ‘cancel’ is clicked
  celo_buy_edit = 'celo_buy_edit', // when ‘edit’ is clicked
  celo_buy_error = 'celo_buy_error', // error in send flow
  celo_sell_continue = 'celo_sell_continue', // when ‘review’ button clicked
  celo_sell_confirm = 'celo_sell_confirm', // when ‘sell’ button clicked
  celo_sell_cancel = 'celo_sell_cancel', // when ‘cancel’ is clicked
  celo_sell_edit = 'celo_sell_edit', // when ‘edit’ is clicked
  celo_sell_error = 'celo_sell_error', // error in sell flow

  celo_exchange_start = 'celo_exchange_start',
  celo_exchange_complete = 'celo_exchange_complete',
  celo_exchange_error = 'celo_exchange_error',

  celo_fetch_exchange_rate_start = 'celo_fetch_exchange_rate_start',
  celo_fetch_exchange_rate_complete = 'celo_fetch_exchange_rate_complete',
  celo_fetch_exchange_rate_error = 'celo_fetch_exchange_rate_error',

  celo_withdraw_review = 'celo_withdraw_review', // when ‘review’ is clicked on the withdraw amount screen
  celo_withdraw_edit = 'celo_withdraw_edit', // when ‘edit’ is clicked on the review screen
  celo_withdraw_cancel = 'celo_withdraw_cancel', // when ’cancel’ is clicked on the review screen
  celo_withdraw_confirm = 'celo_withdraw_confirm', // when ‘withdraw’ is clicked on the review screen
  celo_withdraw_completed = 'celo_withdraw_completed', // when the transaction for the withdrawal is completed
  celo_withdraw_error = 'celo_withdraw_error', // when there's an error on the withdrawal transaction
}

export enum FiatExchangeEvents {
  external_exchange_link = 'external_exchange_link',
}

export enum GethEvents {
  blockchain_corruption = 'blockchain_corruption',
  geth_init_start = 'geth_init_start',
  geth_init_success = 'geth_init_success',
  geth_init_failure = 'geth_init_failure',
  geth_restart_to_fix_init = 'geth_restart_to_fix_init',
  prompt_forno = 'prompt_forno',
  create_geth_start = 'create_geth_start',
  create_geth_finish = 'create_geth_finish',
  create_geth_error = 'create_geth_error',
  start_geth_start = 'start_geth_start',
  start_geth_finish = 'start_geth_finish',
}

export enum NetworkEvents {
  // Events triggered when the app detects it is connected or disconnected from the Celo network.
  network_connected = 'network_connected',
  network_disconnected = 'network_disconnected',

  // Events triggered when the app detects it loses or restores sync with the Celo network.
  network_sync_lost = 'network_sync_lost',
  network_sync_restored = 'network_sync_restored',

  // Events triggered during a syncing or waiting to start syncing.
  network_sync_waiting = 'network_sync_waiting',
  network_sync_start = 'network_sync_start',
  network_sync_finish = 'network_sync_finish',
  network_sync_error = 'network_sync_error',
}

export enum ContractKitEvents {
  init_contractkit_start = 'init_contractkit_start',
  init_contractkit_geth_init_start = 'init_contractkit_geth_init_start',
  init_contractkit_geth_init_finish = 'init_contractkit_geth_init_finish',
  init_contractkit_get_ipc_start = 'init_contractkit_get_ipc_start',
  init_contractkit_get_ipc_finish = 'init_contractkit_get_ipc_finish',
  init_contractkit_get_wallet_start = 'init_contractkit_get_wallet_start',
  init_contractkit_get_wallet_finish = 'init_contractkit_get_wallet_finish',
  init_contractkit_init_wallet_finish = 'init_contractkit_init_wallet_finish',
  init_contractkit_finish = 'init_contractkit_finish',
}

export type AnalyticsEventType =
  | AppEvents
  | HomeEvents
  | SettingsEvents
  | OnboardingEvents
  | VerificationEvents
  | IdentityEvents
  | InviteEvents
  | EscrowEvents
  | FiatExchangeEvents
  | SendEvents
  | RequestEvents
  | FeeEvents
  | TransactionEvents
  | CeloExchangeEvents
  | GethEvents
  | NetworkEvents
