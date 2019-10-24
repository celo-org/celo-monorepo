import { isE164NumberStrict } from '@celo/utils/lib/phoneNumbers'
import { isValidAddress } from '@celo/utils/lib/signatureUtils'
import express from 'express'
import { either, isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'

export function parseRequest<T>(
  requestType: t.Type<T>,
  processor: (req: express.Request, res: express.Response, parsedRequest: T) => Promise<void>
) {
  return async (req: express.Request, res: express.Response) => {
    const parsedRequest = requestType.decode(req.body)
    if (isLeft(parsedRequest)) {
      res.status(422).json({
        success: false,
        error: 'Error parsing invalid request',
        errors: serializeErrors(parsedRequest.left),
      })
    } else {
      try {
        await processor(req, res, parsedRequest.right)
      } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, error: 'Something went wrong' })
      }
    }
  }
}

export const E164PhoneNumberType = new t.Type<string, string, unknown>(
  'E164Number',
  t.string.is,
  (input, context) =>
    either.chain(
      t.string.validate(input, context),
      (stringValue) =>
        isE164NumberStrict(stringValue)
          ? t.success(stringValue)
          : t.failure(stringValue, context, 'is not a valid e164 number')
    ),
  String
)

export const AddressType = new t.Type<string, string, unknown>(
  'Address',
  t.string.is,
  (input, context) =>
    either.chain(
      t.string.validate(input, context),
      (stringValue) =>
        isValidAddress(stringValue)
          ? t.success(stringValue)
          : t.failure(stringValue, context, 'is not a valid address')
    ),
  String
)

export type Address = t.TypeOf<typeof AddressType>
export type E164Number = t.TypeOf<typeof E164PhoneNumberType>

function serializeErrors(errors: t.Errors) {
  let serializedErrors: any = {}
  errors.map((error) => {
    const expectedType = error.context[error.context.length - 1].type
    const path = error.context.map(({ key }) => key).join('.')
    const value =
      error.message ||
      `Expected value at path ${path} to be of type ${expectedType.name}, but received ${
        error.value
      }`

    // Create recursive payload in case of nested properties
    let payload: any = value
    for (let index = error.context.length - 1; index > 0; index--) {
      const innerError = payload
      payload = {}
      payload[error.context[index].key] = innerError
    }

    serializedErrors = { ...serializedErrors, ...payload }
  })
  return serializedErrors
}
