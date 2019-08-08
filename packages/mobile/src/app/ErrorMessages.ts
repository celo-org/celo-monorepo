export enum ErrorMessages {
  TRANSACTION_FAILED = 'transactionFailed',
  EXCHANGE_FAILED = 'exchangeFailed',
  INVALID_INVITATION = 'invalidInvite',
  INCORRECT_PIN = 'incorrectPin',
  SET_PIN_FAILED = 'setPinFailed',
  NSF_GOLD = 'notEnoughGoldError',
  NSF_DOLLARS = 'notEnoughDollarsError',
  NSF_TO_SEND = 'needMoreFundsToSend',
  INVALID_AMOUNT = 'invalidAmount',
  INVALID_BACKUP = 'invalidBackup',
  IMPORT_BACKUP_FAILED = 'importBackupFailed',
  INVALID_PHONE_NUMBER = 'nuxVerification2:invalidPhone',
  NOT_READY_FOR_CODE = 'nuxVerification2:notReadyForCode',
  EMPTY_INVITE_CODE = 'nuxNamePin1:emptyInviteCode',
  EMPTY_ATTESTATION_CODE = 'nuxVerification2:emptyVerificationCode',
  INVALID_ATTESTATION_CODE = 'nuxVerification2:invalidVerificationCode',
  REPEAT_ATTESTATION_CODE = 'nuxVerification2:repeatVerificationCode',
  VERIFICATION_FAILURE = 'nuxVerification2:verificationFailure',
  VERIFICATION_TIMEOUT = 'nuxVerification2:verificationTimeout',
  INVALID_ACCOUNT = 'invalidAccount',
  CANT_SELECT_INVALID_PHONE = 'cantSelectInvalidPhone',
  CAN_NOT_REQUEST_FROM_UNVERIFIED = 'canNotRequestFromUnverified',
  REFRESH_FAILED = 'refreshFailedUnexpectedly',
  INVITE_FAILED = 'inviteFailed',
  SEND_PAYMENT_FAILED = 'sendPaymentFailed',
  PAYMENT_REQUEST_FAILED = 'paymentRequestFailed',
  ESCROW_TRANSFER_FAILED = 'escrowTransferFailed',
  ESCROW_WITHDRAWAL_FAILED = 'escrowWithdrawalFailed',
  RECLAIMING_ESCROWED_PAYMENT_FAILED = 'reclaimingEscrowedPaymentFailed',
  EXCHANGE_RATE_FAILED = 'exchangeFlow9:errorRefreshingRate',
  EXCHANGE_RATE_CHANGE = 'exchangeFlow9:exchangeRateChange',
  REDEEM_INVITE_FAILED = 'inviteFlow11:redeemFailed',
  FIREBASE_DISABLED = 'dev:firebaseDisabled',
  FIREBASE_FAILED = 'firebaseFailed',
  IMPORT_CONTACTS_FAILED = 'importContactsFailed',
  GAS_PRICE_UPDATE_FAILED = 'gasPriceUpdateFailed',
  QR_FAILED_NO_ADDRESS = 'qrFailedNoAddress',
  QR_FAILED_INVALID_ADDRESS = 'qrFailedInvalidAddress',
  CALCULATE_FEE_FAILED = 'calculateFeeFailed',
}
