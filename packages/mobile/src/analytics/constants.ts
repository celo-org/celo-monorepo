import { DefaultEventNames } from '@celo/react-components/analytics/constants'

export enum CustomEventNames {
  language_select = 'language_select',
  nux_continue = 'nux_continue',
  full_name_input = 'full_name_input',
  invitation_code = 'invitation_code',
  signup_submit = 'signup_submit',
  blockChainCorruption = 'block_chain_corruption',
  disconnect_banner = 'disconnect_banner',
  gold_cancel1 = 'gold_cancel1',
  gold_cancel2 = 'gold_cancel2',
  gold_cancel3 = 'gold_cancel3',
  photo_education_cancel1 = 'photo_education_cancel1',
  photo_education_cancel2 = 'photo_education_cancel2',
  photo_education_cancel3 = 'photo_education_cancel3',
  exchange_gold_nux = 'exchange_gold_nux',
  wallet_gold_nux = 'wallet_gold_nux',
  dollar_cancel1 = 'dollar_cancel1',
  dollar_cancel2 = 'dollar_cancel2',
  dollar_cancel3 = 'dollar_cancel3',
  send_dollar_nux = 'send_dollar_nux',
  wallet_dollar_nux = 'wallet_dollar_nux',
  send_input = 'send_input',
  transaction_details = 'transaction_details',
  send_continue = 'send_continue',
  send_select_cancel = 'send_select_cancel',
  send_dollar_confirm = 'send_dollar_confirm',
  edit_dollar_confirm = 'edit_dollar_confirm',
  send_invite_details = 'send_invite_details',
  send_invite = 'send_invite',
  edit_send_invite = 'edit_send_invite',

  // Send events, separate from button tracking above
  send_dollar_transaction = 'send_dollar_transaction',
  send_dollar_transaction_confirmed = 'send_dollar_transaction_confirmed',

  fetch_balance = 'fetch_balance',

  // Verification event and sub-events
  verification = 'verification',
  verification_setup = 'verification_setup',
  verification_get_status = 'verification_get_status',
  verification_request_attestations = 'verification_request_attestations',
  verification_requested_attestations = 'verification_requested_attestations',
  verification_get_attestations = 'verification_get_attestations',
  verification_set_account = 'verification_set_account',
  verification_reveal_attestation = 'verification_reveal_attestation',
  verification_revealed_attestation = 'verification_revealed_attestation',
  verification_codes_received = 'verification_codes_received',
  verification_complete_attestation = 'verification_complete_attestation',
  verification_completed_attestation = 'verification_completed_attestation',
  verification_manual_selected = 'verification_manual_selected',
  verification_failed = 'verification_failed',
  verification_cancelled = 'verification_cancelled',
  verification_success = 'verification_success',
  verification_timed_out = 'verification_timed_out',

  verification_actionable_attestation_start = 'verification_actionable_attestation_start',
  verification_actionable_attestation_finish = 'verification_actionable_attestation_finish',
  verification_validate_code_start = 'verification_validate_code_start',
  verification_validate_code_finish = 'verification_validate_code_finish',

  redeem_invite_success = 'redeem_invite_success',
  redeem_invite_timed_out = 'redeem_invite_timed_out',
  redeem_invite_failed = 'redeem_invite_failed',

  photos_education = 'photos_education',
  get_backup_key = 'earn_celo_gold',
  earn_celo_gold = 'earn_celo_gold',
  user_restart = 'user_restart',
  pin_continue = 'pin_continue',
  pin_wallet_import = 'pin_wallet_import',
  pin_value = 'pin_value',
  pin_create_button = 'pin_create_button',

  // Screen name: Invite_Friends, Invite_Friends_Fee
  friend_invited = 'friend_invited', // to record the name or number of the friend a user is inviting per an invite session
  // TODO: this event is tracked, but isn't showing up on screen, so it is untested
  invite_cancel = 'invite_cancel', // to count the # of taps on the “Cancel” element in the upper left corner
  // TODO: Add this metric later. There doens't appear to be a Cancel button in the upper left of Invite_Friends_Review
  // invite_fee_cancel = 'invite_fee_cancel', // to count the # of taps on “Cancel” in upper left of Invite_Friends_Review
  invite_edit = 'invite_edit', // to count the # of taps on “Cancel” button at bottom of Invite_Friends_Review
  invite_friends_sms = 'invite_friends_sms', // to count the # of taps on “Invite with SMS" button on Invite_Friends_Review
  invite_friends_whatsapp = 'invite_friends_whatsapp', // to count the # of taps on “Invite with WhatsApp" button on Invite_Friends_Review

  // Screen name: Backup_Phrase, Backup_Insist, Backup_Share, Backup_Set
  set_backup_phrase = 'set_backup_phrase', // (count # of taps on “Set Backup Phrase” in Backup_Phrase) [we should not track the actual value of this field, just whether the user filled it out]
  set_social_backup = 'set_social_backup', // (count # of taps on "Set up Social Backup")
  delay_backup = 'delay_backup', // (Count # of taps on "Delay" button in Backup_Phrase)
  skip_backup = 'skip_backup', // (count # of taps on “Skip” button in Backup_Phrase)
  view_backup_phrase = 'view_backup_phrase', // (count # of taps on "View Backup Phrase" after already backed up)
  view_social_backup = 'view_social_backup', // (count # of taps on "View Social Backup" after already set up)
  skip_social_backup = 'skip_social_backup', // (count # of taps on "Skip Social Backup" )
  backup_cancel = 'backup_cancel', // (count # of taps on "Cancel" button in Backup_Phrase)
  insist_backup_phrase = 'insist_backup_phrase', // (count # of taps on “Set Backup Phrase” in Backup_Insist)
  insist_skip_backup = 'insist_skip_backup', // (count # of taps on “Do Later” in Backup_Insist)
  whatsapp_backup = 'whatsapp_backup', // (count # of taps on “Send with Whatsapp” in Backup_Share)
  backup_continue = 'backup_continue', // (count # of taps on “Continue” button in Backup_Phrase)
  social_backup_continue = 'social_backup_continue', // (Count # of taps on "Backup with Friends" in Backup_Phrase)

  // Screen name: Backup_Quiz, Question_Incorrect, Backup_Confirmed
  question_select = 'question_select', // (track # of input selections on Backup_Verify screen)
  question_submit = 'question_submit', // (track # of taps on “Submit” button for Backup_Quiz screen)
  question_cancel = 'questions_cancel', // (track # of taps on "Cancel" button on the Backup_Quiz Screens)
  question_incorrect = 'question_incorrect', // (track # of taps on “See Backup Phrase” in Backup_Quiz)
  question_done = 'question_done', // (track # of taps on “Done” button on the Backup_Confirmed screen)

  // Screen name: Backup_Verify
  backup_paste = 'backup_paste', // (track # of pastes in input field for Backup_Verify screen)
  backup_paste_submit = 'backup_paste_submit', // (track # of taps on "Submit" button for Backup_Verify screen)
  backup_paste_cancel = 'backup_paste_cancel', // (track # of taps on "Cancel" button on the Backup_Verify screen)
  backup_paste_incorrect = 'backup_paste_incorrect', // (track # of taps on "See Backup Phrase" in Backup_Verify screen)
  backup_paste_done = 'backup_paste_done', // (track # of taps on "Done" button on the Backup_Verify screen)

  // Screens: Exchange_Tutorial, Exchange_Home, Exchange_Currency
  exchange_button = 'exchange_button', // count # of taps on the exchange button in Exchange_Home
  exchange_dollar_input = 'exchange_dollar_input', // record the input of Celo$ form field in Exchange_Currency
  // triggered when focus is moved away from text editing
  exchange_gold_input = 'exchange_gold_input', // record the input of Gold form field in Exchange_Currency,
  // triggered when focus is moved away from text editing
  exchange_continue = 'exchange_continue', // record # of taps on “Continue” button on Exchange_Currency
  currency_swap = 'currency_swap', // record # of taps on the double arrow button in Exchange_Currency

  // Screen: Exchange_Review
  exchange_confirm = 'exchange_confirm', // to count the # of taps on the exchange button here)
  exchange_edit = 'exchange_edit', // to count # of times users click the edit button, change transaction)
  exchange_cancel = 'exchange_cancel', // to count # of taps on the “Cancel” in the upper left corner)

  // Screen name: Account_Home, Account_Edit, Account_Edit_Name
  edit_profile = 'edit_profile', // to count the # of taps on the edit profile button in Account_Home
  edit_name = 'edit_name', // to count the # of taps on the “Edit Name” nav element in Account_Edit
  edit_name_input = 'edit_name_input', // to record the input of the form input field on Account_Edit_Name page
  edit_name_submit = 'edit_name_submit', // to count the # of taps on the "Done" button on Account_Edit_Name page
  edit_account_cancel = 'edit_account_cancel', // to count the # of taps on “Cancel” in upper left of Account_Edit
  edit_name_cancel = 'edit_name_cancel', // to count the # of taps on “Cancel” in upper left of Account_Edit_Name

  // Screen names: Wallet_Recover, Wallet_Import
  import_phrase_input = 'import_phrase_input', // to record the # of times a value is inputted here [we should not track the actual value of this field, just whether the user filled it out]
  import_wallet_submit = 'import_wallet_submit', // to count the # of times that the “Restore Celo Wallet” button is pressed
  import_wallet_cancel = 'import_wallet_cancel', // to count the # of times that the “Cancel” button is pressed

  // Request Money events
  // request_select_cancel is captured in send_select_cancel
  request_payment_continue = 'request_payment_continue',
  request_payment_request = 'request_payment_request',
  request_payment_decline = 'request_payment_decline',
  request_payment_pay = 'request_payment_pay',
  request_payment_edit = 'request_payment_edit',
  request_payment_review = 'request_payment_review',

  // Escrowed payments
  escrowed_payment_reclaimed_by_sender = 'escrowed_payment_reclaimed_by_sender',
  escrowed_payment_reclaimEdit_by_sender = 'escrowed_payment_reclaimEdit_by_sender',
  escrowed_payment_withdrawn_by_receiver = 'escrowed_payment_withdrawn_by_receiver',
  clicked_escrowed_payment_notification = 'clicked_escrowed_payment_notification',
  clicked_escrowed_payment_send_message = 'clicked_escrowed_payment_send_message',

  // Notifications
  celogold_notification_confirm = 'celogold_notification_confirm',
  celogold_notification_dismiss = 'celogold_notification_dismiss',
  celorewards_notification_confirm = 'celorewards_notification_confirm',
  celorewards_notification_dismiss = 'celorewards_notification_dismiss',
  invitefriends_notification_confirm = 'invitefriends_notification_confirm',
  invitefriends_notification_dismiss = 'invitefriends_notification_dismiss',

  // QR Code
  qrcode_main_screen_visit = 'qrcode_main_screen_visit',

  // Performance
  transaction_send_start = 'transaction_send_start',
  transaction_send_gas_estimated = 'transaction_send_gas_estimated',
  transaction_send_gas_hash_received = 'transaction_send_gas_hash_received',
  transaction_send_gas_receipt = 'transaction_send_gas_receipt',
}

export enum CommonValues {
  success = 'success',
  failure = 'failure',
  cancel = 'cancel',
  timeout = 'timeout',
}

// TODO(nitya): separate this out by event name
export const PROPERTY_PATH_WHITELIST = [
  'address',
  'component',
  'countryCode',
  'cta',
  'currentScreen',
  'dollarBalance',
  'dollarPendingBalance',
  'error',
  'exchangeInputAmount',
  'exchangeRate',
  'fullName',
  'goldBalance',
  'goldPendingBalance',
  'inviteCode',
  'isCorrect',
  'issuer',
  'label',
  'language',
  'makerAmount',
  'makerToken',
  'makerTokenAmount',
  'name',
  'navigation.state.key',
  'navigation.state.routeName',
  'nextScreen',
  'note',
  'phoneNumber',
  'previousScreen',
  'query',
  'recipientAddress',
  'requesteeAddress',
  'requestIndex',
  'rootTag',
  'routeName',
  'screen',
  'selectedAnswer',
  'selectedRecipientAddress',
  'selectedRecipientPhoneNumber',
  'sendAmount',
  'subtitle',
  'success',
  'syncProgress',
  'takerAmount',
  'testnet',
  'timeElapsed',
  'title',
  'tti',
  'txId',
  'verificationIndex',
  'verificationsRemaining',
]
export { DefaultEventNames }
