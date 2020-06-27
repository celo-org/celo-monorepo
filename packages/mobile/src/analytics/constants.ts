export enum CustomEventNames {
  // App
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  language_select = 'language_select',

  // Onboarding
  phone_number_set = 'phone_number_set',
  invalid_phone_number = 'invalid_phone_number',

  // Education
  gold_educate_1_next = 'gold_educate_1_next', // next button on 1st edu screen
  gold_educate_2_next = 'gold_educate_2_next', // next button on 2nd edu screen
  gold_educate_3_next = 'gold_educate_3_next', // next button on 3rd edu screen

  gold_cancel1 = 'gold_cancel1', // cancel button on 1st edu screen
  gold_cancel2 = 'gold_cancel2', // cancel button on 2nd edu screen
  gold_cancel3 = 'gold_cancel3', // cancel button on 3rd edu screen

  backup_educate_1_next = 'backup_educate_1_next', // next button on 1st edu screen
  backup_educate_2_next = 'backup_educate_2_next', // next button on 2nd edu screen
  backup_educate_3_next = 'backup_educate_3_next', // next button on 3rd edu screen
  backup_educate_4_next = 'backup_educate_4_next', // next button on 4th edu screen

  backup_educate_1_cancel = 'backup_educate_1_cancel', // cancel button on 1st edu screen
  backup_educate_2_cancel = 'backup_educate_2_cancel', // cancel button on 2nd edu screen
  backup_educate_3_cancel = 'backup_educate_3_cancel', // cancel button on 3rd edu screen
  backup_educate_4_cancel = 'backup_educate_4_cancel', // cancel button on 4th edu screen

  // Payment send
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

  invite_success = 'invite_success', // when there is an error sending an invite
  invite_error = 'invite_error', // when there is an error sending an invite

  // Payment request
  request_amount_back = 'request_amount_back', // back button pressed on amount screen
  request_cancel = 'request_cancel', // when cancel is clicked after launching request flow
  request_scan = 'request_scan', // when scan QR icon is selected from the request screen
  request_select_recipient = 'request_select_recipient', // when recipient was selected
  request_continue = 'request_continue', // when next button pressed on amount enter page
  request_unavailable = 'request_unavailable', // when request attempted to unverified user
  request_confirm_back = 'request_confirm_back', // when back button pressed on request confirmation screen
  request_confirm = 'request_confirm', // when request button pressed on request confirmation screen
  request_error = 'request_error', // when there is an error requesting a transaction

  incoming_request_payment_decline = 'incoming_request_payment_decline',
  incoming_request_payment_pay = 'incoming_request_payment_pay',
  incoming_request_payment_review = 'incoming_request_payment_review',

  outgoing_request_payment_review = 'outgoing_request_payment_review',
  outgoing_request_payment_remind = 'outgoing_request_payment_remind',
  outgoing_request_payment_cancel = 'outgoing_request_payment_cancel',

  // Send events, separate from button tracking above
  send_dollar_transaction = 'send_dollar_transaction',
  send_dollar_transaction_confirmed = 'send_dollar_transaction_confirmed',

  fetch_balance = 'fetch_balance',

  // Verification event and sub-events
  verification_start = 'verification_start',
  verification_hash_retrieved = 'verification_hash_retrieved',
  verification_setup = 'verification_setup',
  verification_get_status = 'verification_get_status',
  verification_request_attestations = 'verification_request_attestations',
  verification_wait_for_select_issuers = 'verification_wait_for_select_issuers',
  verification_selecting_issuer = 'verification_selecting_issuer',
  verification_requested_attestations = 'verification_requested_attestations',
  verification_get_attestations = 'verification_get_attestations',
  verification_set_account = 'verification_set_account',
  verification_reveal_attestation = 'verification_reveal_attestation',
  verification_revealed_attestation = 'verification_revealed_attestation',
  verification_reveal_error = 'verification_reveal_error',
  verification_wait_for_attestation_code = 'verification_wait_for_attestation_code',
  verification_code_received = 'verification_code_received',
  verification_complete_attestation = 'verification_complete_attestation',
  verification_completed_attestation = 'verification_completed_attestation',
  verification_failed = 'verification_failed',
  verification_cancelled = 'verification_cancelled',
  verification_success = 'verification_success',
  verification_timed_out = 'verification_timed_out',
  verification_error = 'verification_error',

  verification_actionable_attestation_start = 'verification_actionable_attestation_start',
  verification_actionable_attestation_finish = 'verification_actionable_attestation_finish',
  verification_validate_code_start = 'verification_validate_code_start',
  verification_validate_code_finish = 'verification_validate_code_finish',

  phone_number_quota_purchase_success = 'phone_number_quota_purchase_success',
  phone_number_quota_purchase_failure = 'phone_number_quota_purchase_failure',
  phone_number_quota_purchase_skip = 'phone_number_quota_purchase_skip',

  redeem_invite_success = 'redeem_invite_success',
  redeem_invite_timed_out = 'redeem_invite_timed_out',
  redeem_invite_failed = 'redeem_invite_failed',

  get_backup_key = 'get_backup_key',
  user_restart = 'user_restart',
  pin_created = 'pin_created',
  pin_failed_to_set = 'pin_failed_to_set',
  pin_never_set = 'pin_never_set',

  // Screen name: Invite_Friends, Invite_Friends_Fee
  friend_invited = 'friend_invited', // to record the name or number of the friend a user is inviting per an invite session
  // TODO: this event is tracked, but isn't showing up on screen, so it is untested
  // TODO: Add this metric later. There doens't appear to be a Cancel button in the upper left of Invite_Friends_Review
  // invite_fee_cancel = 'invite_fee_cancel', // to count the # of taps on “Cancel” in upper left of Invite_Friends_Review
  invite_edit = 'invite_edit', // to count the # of taps on “Cancel” button at bottom of Invite_Friends_Review
  invite_friends_sms = 'invite_friends_sms', // to count the # of taps on “Invite with SMS" button on Invite_Friends_Review
  invite_friends_whatsapp = 'invite_friends_whatsapp', // to count the # of taps on “Invite with WhatsApp" button on Invite_Friends_Review
  invite_skip_failed = 'invite_skip_failed',
  invite_skip_complete = 'invite_skip_complete',

  backup_start = 'backup_start', // ‘set up now’ button click
  backup_setup_info = 'backup_setup_info',
  backup_quiz_backspace = 'backup_quiz_backspace', // whenever the backspace is pressed
  backup_quiz_submit = 'backup_quiz_submit', // (Count # of taps on "Submit" button in Backup_Quiz)
  backup_quiz_success = 'backup_quiz_success', // (Count # of successful Account Key confirmations Backup_Quiz)
  backup_quiz_incorrect = 'backup_quiz_incorrect', // (Count # of failed Account Key confirmations Backup_Quiz)

  // Screen name: Backup_Phrase, Backup_Insist, Backup_Share, Backup_Set
  delay_backup = 'delay_backup', // (Count # of taps on "Delay" button in Backup_Phrase)
  backup_cancel = 'backup_cancel', // (count # of taps on "Cancel" button in Backup_Phrase/BackupQuiz)
  backup_cancel_procrastinate = 'backup_cancel_procrastinate', // when choosing to continue cancel and delay setup
  backup_continue = 'backup_continue', // (count # of taps on “Continue” button in Backup_Phrase)
  backup_setup_toggle_enable = 'backup_setup_toggle_enable', // (count # of slides to agree on "I wrote down account key" Switch in Backup_Phrase)
  backup_setup_toggle_disable = 'backup_setup_toggle_disable', // (count # of slides to disagree on "I wrote down account key" Switch in Backup_Phrase)
  backup_error = 'backup_error',
  failed_to_retrieve_mnemonic = 'failed_to_retrieve_mnemonic',

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

  // Screen: Exchange_Review
  exchange_edit = 'exchange_edit', // to count # of times users click the edit button, change transaction)
  exchange_cancel = 'exchange_cancel', // to count # of taps on the “Cancel” in the upper left corner)

  // Screen name: Account_Home, Account_Edit, Account_Edit_Name
  edit_profile = 'edit_profile', // to count the # of taps on the edit profile button in Account_Home
  edit_name = 'edit_name', // to count the # of taps on the “Edit Name” nav element in Account_Edit

  // Screen names: Wallet_Recover, Wallet_Import
  import_wallet_submit = 'import_wallet_submit', // to count the # of times that the “Restore Celo Wallet” button is pressed
  import_contacts = 'import_contacts',
  import_contact_error = 'import_contact_error',
  fetched_contacts = 'fetched_contacts',
  add_contact_match = 'add_contact_match',

  // Escrowed payments
  escrowed_payment_review = 'escrowed_payment_review',
  escrow_transfer = 'escrow_transfer',
  escrowed_payment_reclaimed_by_sender = 'escrowed_payment_reclaimed_by_sender',
  escrowed_payment_reclaimEdit_by_sender = 'escrowed_payment_reclaimEdit_by_sender',
  escrowed_payment_withdrawn_by_receiver = 'escrowed_payment_withdrawn_by_receiver',
  escrow_failed_to_withdraw = 'escrow_failed_to_withdraw',
  escrow_failed_to_reclaim = 'escrow_failed_to_reclaim',
  escrow_failed_to_transfer = 'escrow_failed_to_transfer',
  escrow_failed_to_fetch_sent = 'escrow_failed_to_fetch_sent',
  clicked_escrowed_payment_notification = 'clicked_escrowed_payment_notification',
  clicked_escrowed_payment_send_message = 'clicked_escrowed_payment_send_message',

  // Notifications
  celogold_notification_confirm = 'celogold_notification_confirm',
  celogold_notification_dismiss = 'celogold_notification_dismiss',
  celorewards_notification_confirm = 'celorewards_notification_confirm',
  celorewards_notification_dismiss = 'celorewards_notification_dismiss',
  invitefriends_notification_confirm = 'invitefriends_notification_confirm',
  invitefriends_notification_dismiss = 'invitefriends_notification_dismiss',

  // Performance
  transaction_send_start = 'transaction_send_start',
  transaction_send_gas_estimated = 'transaction_send_gas_estimated',
  transaction_send_gas_hash_received = 'transaction_send_gas_hash_received',
  transaction_send_gas_receipt = 'transaction_send_gas_receipt',
  transaction_error = 'transaction_error',
  transaction_exception = 'transaction_exception',

  // Fee
  fee_rendered = 'fee_rendered',
  estimate_fee_failed = 'estimate_fee_failed',
  fetch_tobin_tax_failed = 'fetch_tobin_tax_failed',

  // Token
  transfer_token_error = 'transfer_token_error',
  unexpected_maker_token = 'unexpected_maker_token',

  // Geth
  blockchain_corruption = 'blockchain_corruption',
  geth_init_success = 'geth_init_success',
  geth_init_failure = 'geth_init_failure',
  geth_restart_to_fix_init = 'geth_restart_to_fix_init',
  prompt_forno = 'prompt_forno',
}

export enum CommonValues {
  success = 'success',
  failure = 'failure',
  cancel = 'cancel',
  timeout = 'timeout',
}

export type EventPropertyType = {
  [key in PropertyPathWhitelist]?: any
}

// TODO(nitya): separate this out by event name
export enum PropertyPathWhitelist {
  address = 'address',
  component = 'component',
  contacts = 'contacts',
  contactsMatched = 'contactsMatched',
  context = 'context',
  countryCode = 'countryCode',
  cta = 'cta',
  currentScreen = 'currentScreen',
  didQuery = 'didQuery',
  dollarAmount = 'dollarAmount',
  dollarBalance = 'dollarBalance',
  dollarPendingBalance = 'dollarPendingBalance',
  duration = 'duration',
  error = 'error',
  exchangeInputAmount = 'exchangeInputAmount',
  exchangeRate = 'exchangeRate',
  fee = 'fee',
  feeType = 'feeType',
  fullName = 'fullName',
  gethOutcome = 'gethOutcome',
  goldAmount = 'goldAmount',
  goldBalance = 'goldBalance',
  goldPendingBalance = 'goldPendingBalance',
  goldToDollarExchangeRate = 'goldToDollarExchangeRate',
  inputToken = 'inputToken',
  inviteCode = 'inviteCode',
  isCorrect = 'isCorrect',
  isInvite = 'isInvite',
  issuer = 'issuer',
  label = 'label',
  language = 'language',
  localCurrency = 'localCurrency',
  localCurrencyAmount = 'localCurrencyAmount',
  localCurrencyExchangeRate = 'localCurrencyExchangeRate',
  makerAmount = 'makerAmount',
  makerToken = 'makerToken',
  makerTokenAmount = 'makerTokenAmount',
  method = 'method',
  name = 'name',
  'navigation.state.key' = 'navigation.state.key',
  'navigation.state.routeName' = 'navigation.state.routeName',
  nextScreen = 'nextScreen',
  note = 'note',
  obfuscatedPhoneNumber = 'obfuscatedPhoneNumber',
  pincodeType = 'pincodeType',
  previousScreen = 'previousScreen',
  query = 'query',
  recipientAddress = 'recipientAddress',
  recipientKind = 'recipientKind',
  requesteeAddress = 'requesteeAddress',
  requestIndex = 'requestIndex',
  rootTag = 'rootTag',
  routeName = 'routeName',
  screen = 'screen',
  selectedAnswer = 'selectedAnswer',
  selectedRecipientAddress = 'selectedRecipientAddress',
  selectedRecipientPhoneNumber = 'selectedRecipientPhoneNumber',
  sendAmount = 'sendAmount',
  sessionId = 'sessionId',
  subtitle = 'subtitle',
  success = 'success',
  statusCode = 'statusCode',
  syncProgress = 'syncProgress',
  takerAmount = 'takerAmount',
  testnet = 'testnet',
  timeElapsed = 'timeElapsed',
  title = 'title',
  to = 'to',
  transactionType = 'transactionType',
  tti = 'tti',
  txId = 'txId',
  validationType = 'validationType',
  verificationIndex = 'verificationIndex',
  verificationsRemaining = 'verificationsRemaining',

  // Attestations
  isVerified = 'isVerified',
  numAttestationsRemaining = 'numAttestationsRemaining',
  total = 'total',
  completed = 'completed',
  phoneHash = 'phoneHash',
  numAttestationsRequestsNeeded = 'numAttestationsRequestsNeeded',
}
