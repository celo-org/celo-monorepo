import { Response } from 'express'
import logger from './logger'

export enum ErrorMessage {
  UNKNOWN_ERROR = 'CELO_PNP_ERR_00 Something went wrong',
  DATABASE_UPDATE_FAILURE = 'CELO_PNP_ERR_01 DB_ERR Failed to update database entry',
  DATABASE_INSERT_FAILURE = 'CELO_PNP_ERR_02 DB_ERR Failed to insert database entry',
  DATABASE_GET_FAILURE = 'CELO_PNP_ERR_03 DB_ERR Failed to get database entry',
  KEY_FETCH_ERROR = 'CELO_PNP_ERR_04 INIT_ERR Failed to retrieve key from keystore',
  SIGNATURE_COMPUTATION_FAILURE = 'CELO_PNP_ERR_05 Failed to compute BLS signature',
}

export enum WarningMessage {
  INVALID_INPUT = 'CELO_PNP_WARN_01 BAD_INPUT Invalid input paramaters',
  UNAUTHENTICATED_USER = 'CELO_PNP_WARN_02 BAD_INPUT Missing or invalid authentication header',
  EXCEEDED_QUOTA = 'CELO_PNP_WARN_03 QUOTA Requester exceeded salt service query quota',
  UNVERIFIED_USER_ATTEMPT_TO_MATCHMAKE = 'CELO_PNP_WARN_04 QUOTA Unverified user attempting to matchmake',
  DUPLICATE_REQUEST_TO_MATCHMAKE = 'CELO_PNP_WARN_05 QUOTA Attempt to request >1 matchmaking',
}

export type ErrorType = ErrorMessage | WarningMessage

export function respondWithError(res: Response, statusCode: number, error: ErrorType) {
  const loggerMethod = error in WarningMessage ? logger.warn : logger.error
  loggerMethod('Responding with error', error)
  res.status(statusCode).json({ success: false, error })
}
