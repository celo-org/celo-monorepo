import { RootError } from '@celo/base/lib/result'
import { CircuitBreakerError } from '@celo/identity/lib/odis/circuit-breaker'

export enum BackupErrorTypes {
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  DECODE_ERROR = 'DECODE_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  FETCH_ERROR = 'FETCH_ERROR',
  INVALID_BACKUP_ERROR = 'INVALID_BACKUP_ERROR',
  ODIS_SERVICE_ERROR = 'ODIS_SERVICE_ERROR',
  ODIS_RATE_LIMITING_ERROR = 'ODIS_RATE_LIMITING_ERROR',
}

export class AuthorizationError extends RootError<BackupErrorTypes.AUTHORIZATION_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.AUTHORIZATION_ERROR)
  }
}

export class DecodeError extends RootError<BackupErrorTypes.DECODE_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.DECODE_ERROR)
  }
}

export class DecryptionError extends RootError<BackupErrorTypes.DECRYPTION_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.DECRYPTION_ERROR)
  }
}

export class EncryptionError extends RootError<BackupErrorTypes.ENCRYPTION_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.ENCRYPTION_ERROR)
  }
}

export class FetchError extends RootError<BackupErrorTypes.FETCH_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.FETCH_ERROR)
  }
}

export class InvalidBackupError extends RootError<BackupErrorTypes.INVALID_BACKUP_ERROR> {
  constructor(readonly error?: Error) {
    super(BackupErrorTypes.INVALID_BACKUP_ERROR)
  }
}

export class OdisServiceError extends RootError<BackupErrorTypes.ODIS_SERVICE_ERROR> {
  constructor(readonly error?: Error, readonly version?: string) {
    super(BackupErrorTypes.ODIS_SERVICE_ERROR)
  }
}

export class OdisRateLimitingError extends RootError<BackupErrorTypes.ODIS_RATE_LIMITING_ERROR> {
  constructor(readonly notBefore?: number, readonly error?: Error) {
    super(BackupErrorTypes.ODIS_RATE_LIMITING_ERROR)
  }
}

export type BackupError =
  | AuthorizationError
  | CircuitBreakerError
  | DecodeError
  | DecryptionError
  | EncryptionError
  | FetchError
  | InvalidBackupError
  | OdisServiceError
  | OdisRateLimitingError
