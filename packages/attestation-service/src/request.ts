import express from 'express'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'

export function createValidatedHandler<T>(
  requestType: t.Type<T>,
  handler: (req: express.Request, res: express.Response, parsedRequest: T) => Promise<void>
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
        await handler(req, res, parsedRequest.right)
      } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, error: 'Something went wrong' })
      }
    }
  }
}

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

export function respondWithError(res: express.Response, statusCode: number, error: string) {
  res.status(statusCode).json({ success: false, error })
}
