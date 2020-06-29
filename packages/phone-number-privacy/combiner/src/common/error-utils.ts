import { Response } from 'firebase-functions'
import { VERSION } from '../config'
import logger from './logger'

export enum ErrorMessage {
  UNKNOWN_ERROR = 'CELO_PNP_ERR_00 Something went wrong',
  DATABASE_UPDATE_FAILURE = 'CELO_PNP_ERR_01 DB_ERR Failed to update database entry',
  DATABASE_INSERT_FAILURE = 'CELO_PNP_ERR_02 DB_ERR Failed to insert database entry',
  DATABASE_GET_FAILURE = 'CELO_PNP_ERR_03 DB_ERR Failed to get database entry',
  KEY_FETCH_ERROR = 'CELO_PNP_ERR_04 INIT_ERR Failed to retrieve key from keystore',
  SIGNATURE_COMPUTATION_FAILURE = 'CELO_PNP_ERR_05 SIG_ERR Failed to compute BLS signature',
  VERIFY_PARITAL_SIGNATURE_ERROR = 'CELO_PNP_ERR_06 SIG_ERR BLS partial signature verification Failure',
  NOT_ENOUGH_PARTIAL_SIGNATURES = 'CELO_PNP_ERR_07 SIG_ERR Not enough partial signatures',
  INCONSISTENT_SINGER_RESPONSES = 'CELO_PNP_ERR_08 SIG_ERR Inconsistent responses from signers',
  ERROR_REQUESTING_SIGNATURE = 'CELO_PNP_ERR_09 SIG_ERR Failed to request signature from signer',
  TIMEOUT_FROM_SIGNER = 'CELO_PNP_ERR_10 SIG_ERR Timeout from signer',
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
  logger.error('Responding with error', error)
  res.status(statusCode).json({ success: false, error, version: VERSION })
}
