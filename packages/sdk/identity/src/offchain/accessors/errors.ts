import { Address } from '@celo/base'
import { RootError } from '@celo/base/lib/result'
import { OffchainErrors } from '../../offchain-data-wrapper'

export enum SchemaErrorTypes {
  InvalidDataError = 'InvalidDataError',
  OffchainError = 'OffchainError',
  UnknownCiphertext = 'UnknownCiphertext',
  UnavailableKey = 'UnavailableKey',
  InvalidKey = 'InvalidKey',
}

export class InvalidDataError extends RootError<SchemaErrorTypes.InvalidDataError> {
  constructor() {
    super(SchemaErrorTypes.InvalidDataError)
  }
}

export class OffchainError extends RootError<SchemaErrorTypes.OffchainError> {
  constructor(readonly error: OffchainErrors) {
    super(SchemaErrorTypes.OffchainError)
  }
}

export class UnknownCiphertext extends RootError<SchemaErrorTypes.UnknownCiphertext> {
  constructor() {
    super(SchemaErrorTypes.UnknownCiphertext)
  }
}

export class UnavailableKey extends RootError<SchemaErrorTypes.UnavailableKey> {
  constructor(readonly account: Address) {
    super(SchemaErrorTypes.UnavailableKey)
    this.message = `Unable to find account ${account}`
  }
}

export class InvalidKey extends RootError<SchemaErrorTypes.InvalidKey> {
  constructor() {
    super(SchemaErrorTypes.InvalidKey)
  }
}

export type SchemaErrors =
  | InvalidDataError
  | OffchainError
  | UnknownCiphertext
  | UnavailableKey
  | InvalidKey
