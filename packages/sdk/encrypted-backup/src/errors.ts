import { RootError } from '@celo/base/lib/result'

export enum BackupErrorTypes {
  DecodeError = 'DecodeError',
}

export class DecodeError extends RootError<BackupErrorTypes.DecodeError> {
  constructor() {
    super(BackupErrorTypes.DecodeError)
  }
}

export type BackupError = DecodeError
