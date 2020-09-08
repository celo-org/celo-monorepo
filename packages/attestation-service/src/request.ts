import { AddressType, E164PhoneNumberType, SaltType } from '@celo/utils/lib/io'
import Logger from 'bunyan'
import express from 'express'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { rootLogger } from './logger'
import { AttestationModel, AttestationStatus } from './models/attestation'

export enum ErrorMessages {
  INVALID_SIGNATURE = 'Invalid signature provided',
  NO_PROVIDER_SETUP = 'No provider was setup for this phone number',
  UNKNOWN_ERROR = 'Something went wrong',
  ATTESTATION_SIGNER_CANNOT_SIGN = 'Attestation signer could not sign',
  DATABASE_IS_OFFLINE = 'Database is offline',
  NODE_IS_SYNCING = 'Full node is not synced',
  NODE_IS_STUCK = 'Full node is not up to date',
}

export const AttestationRequestType = t.type({
  phoneNumber: E164PhoneNumberType,
  account: AddressType,
  issuer: AddressType,
  // io-ts way of defining optional key-value pair
  salt: t.union([t.undefined, SaltType]),
  smsRetrieverAppSig: t.union([t.undefined, t.string]),
})

export type AttestationRequest = t.TypeOf<typeof AttestationRequestType>

export const AttestationResponseType = t.type({
  // Always returned in 1.0.x
  success: t.boolean,

  // Returned for errors in 1.0.x
  error: t.union([t.undefined, t.string]),
  errors: t.union([t.undefined, t.string]),

  // Returned for successful send in 1.0.x
  provider: t.union([t.undefined, t.string]),

  // New fields
  identifier: t.union([t.undefined, t.string]),
  account: t.union([t.undefined, AddressType]),
  issuer: t.union([t.undefined, AddressType]),
  status: t.union([t.undefined, t.string]),
  attempt: t.union([t.undefined, t.number]),
  countryCode: t.union([t.undefined, t.string]),

  // Only used by test endpoint to return randomly generated salt.
  // Never return a user-supplied salt.
  salt: t.union([t.undefined, t.string]),
})

export type AttestationResponse = t.TypeOf<typeof AttestationResponseType>

export function asyncHandler<T>(handler: (req: express.Request, res: Response) => Promise<T>) {
  return (req: express.Request, res: Response) => {
    const handleUnknownError = (error: Error) => {
      if (res.locals.logger) {
        res.locals.logger.error(error)
      }
      respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
    }
    try {
      handler(req, res)
        .then(() => res.locals.logger.info({ res }))
        .catch(handleUnknownError)
    } catch (error) {
      handleUnknownError(error)
    }
  }
}

export function createValidatedHandler<T>(
  requestType: t.Type<T>,
  handler: (req: express.Request, res: Response, parsedRequest: T) => Promise<void>
) {
  return asyncHandler(async (req: express.Request, res: Response) => {
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
      `Expected value at path ${path} to be of type ${expectedType.name}, but received ${error.value}`

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

export function respondWithAttestation(
  res: express.Response,
  attestation: AttestationModel,
  alwaysSuccess?: boolean | undefined,
  salt?: string | undefined
) {
  res.status(alwaysSuccess ? 200 : attestation.failure() ? 422 : 200).json(
    AttestationResponseType.encode({
      success: alwaysSuccess ? true : !attestation.failure(),
      identifier: attestation.identifier,
      account: attestation.account,
      issuer: attestation.issuer,
      attempt: attestation.attempt,
      countryCode: attestation.countryCode,
      status: AttestationStatus[attestation.status],
      salt,
      provider: attestation.provider() ?? undefined,
      errors: attestation.errors ?? undefined,
      error: attestation.currentError(),
    })
  )
}

export type Response = Omit<express.Response, 'locals'> & {
  locals: { logger: Logger } & Omit<any, 'logger'>
}

export function loggerMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const requestLogger = rootLogger.child({
    // @ts-ignore express-request-id adds this
    req_id: req.id,
  })

  res.locals.logger = requestLogger
  requestLogger.info({ req })
  next()
}
