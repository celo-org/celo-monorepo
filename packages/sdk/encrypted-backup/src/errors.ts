import { RootError } from '@celo/base/lib/result'

export enum BackupErrorTypes {
  AuthorizationError = 'AuthorizationError',
  DecodeError = 'DecodeError',
  DecryptionError = 'DecryptionError',
  ImplementationError = 'ImplementationError',
  InvalidBackupError = 'InvalidBackupError',
  OdisError = 'OdisError',
  RateLimitingError = 'RateLimitingError',
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

export class ImplementationError extends RootError<BackupErrorTypes.ImplementationError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.ImplementationError)
  }
}

export class InvalidBackupError extends RootError<BackupErrorTypes.InvalidBackupError> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.InvalidBackupError)
  }
}

export class OdisError extends RootError<BackupErrorTypes.OdisError> {
  constructor(readonly error?: Error, readonly version?: string) {
    super(BackupErrorTypes.OdisError)
  }
}

export class RateLimitingError extends RootError<BackupErrorTypes.RateLimitingError> {
  constructor(readonly notBefore?: number) {
    super(BackupErrorTypes.RateLimitingError)
  }
}

export type BackupError =
  | AuthorizationError
  | DecodeError
  | DecryptionError
  | ImplementationErrors
  | InvalidBackupError
  | OdisError
  | RateLimitingError
