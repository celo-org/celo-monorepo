import express from 'express'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'

export enum ErrorMessages {
  UNKNOWN_ERROR = 'Something went wrong',
}

export function catchAsyncErrorHandler<T>(
  handler: (req: express.Request, res: express.Response) => Promise<T>
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      return handler(req, res)
    } catch (error) {
      console.error(error)
      respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
    }
  }
}

export function createValidatedHandler<T>(
  requestType: t.Type<T>,
  handler: (req: express.Request, res: express.Response, parsedRequest: T) => Promise<void>
) {
  return catchAsyncErrorHandler(async (req: express.Request, res: express.Response) => {
    const parsedRequest = requestType.decode({ ...req.query, ...req.body })
    if (isLeft(parsedRequest)) {
      res.status(422).json({
        success: false,
        error: 'Error parsing invalid request',
        errors: serializeErrors(parsedRequest.left),
      })
    } else {
      return handler(req, res, parsedRequest.right)
    }
  })
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
