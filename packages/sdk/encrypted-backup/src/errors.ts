import { RootError } from '@celo/base/lib/result'

export enum BackupErrorTypes {
  AuthorizationError = 'AuthorizationError',
  DecodeError = 'DecodeError',
  DecryptionError = 'DecryptionError',
  InvalidBackupError = 'InvalidBackupError',
  OdisServiceError = 'OdisServiceError',
  OdisRateLimitingError = 'OdisRateLimitingError',
}

// TODO(victor) Error definitions could either be improved or made more conscise. There is no need
// to define the errors this way if they all have the same fields except their tag, It would also be
// nice to be able to accept a string argument as an error message.

export class AuthorizationError extends RootError<BackupErrorTypes.AuthorizationError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.AuthorizationError)
  }
}

export class DecodeError extends RootError<BackupErrorTypes.DecodeError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.DecodeError)
  }
}

export class DecryptionError extends RootError<BackupErrorTypes.DecryptionError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.DecryptionError)
  }
}

export class InvalidBackupError extends RootError<BackupErrorTypes.InvalidBackupError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.InvalidBackupError)
  }
}

export class OdisServiceError extends RootError<BackupErrorTypes.OdisServiceError> {
  constructor(readonly error?: Error, readonly version?: string) {
    super(BackupErrorTypes.OdisServiceError)
  }
}

export class OdisRateLimitingError extends RootError<BackupErrorTypes.OdisRateLimitingError> {
  constructor(readonly notBefore?: number) {
    super(BackupErrorTypes.OdisRateLimitingError)
  }
}

export type BackupError =
  | AuthorizationError
  | DecodeError
  | DecryptionError
  | InvalidBackupError
  | OdisServiceError
  | OdisRateLimitingError
