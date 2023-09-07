import { ErrorType } from '@celo/phone-number-privacy-common'

export class OdisError extends Error {
  constructor(readonly code: ErrorType, readonly parent?: Error, readonly status: number = 500) {
    // This is necessary when extending Error Classes
    super(code) // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype) // restore prototype chain
  }
}

export function wrapError<T>(
  valueOrError: Promise<T>,
  code: ErrorType,
  status: number = 500
): Promise<T> {
  return valueOrError.catch((parentErr) => {
    throw new OdisError(code, parentErr, status)
  })
}
