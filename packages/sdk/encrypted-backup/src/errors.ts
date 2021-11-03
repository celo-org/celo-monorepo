import { RootError } from '@celo/base/lib/result'

export enum BackupErrorTypes {
  DecodeError = 'DecodeError',
  DecryptionError = 'DecryptionError',
  InvalidBackupError = 'InvalidBackupError',
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

export type BackupError = DecodeError | DecryptionError | InvalidBackupError
