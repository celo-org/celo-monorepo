import { Response } from 'firebase-functions'

export enum ErrorMessages {
  UNKNOWN_ERROR = 'CELO_PNP_ERR_00 Something went wrong',
  DATABASE_UPDATE_FAILURE = 'CELO_PNP_ERR_01 Failed to update database entry',
  DATABASE_INSERT_FAILURE = 'CELO_PNP_ERR_02 Failed to insert database entry',
  DATABASE_GET_FAILURE = 'CELO_PNP_ERR_03 Failed to get databse entry',
  INVALID_INPUT = 'CELO_PNP_ERR_04 Invalid input paramaters',
  EXCEEDED_QUOTA = 'CELO_PNP_ERR_05 Requester exceeded salt service query quota',
  SIGNATURE_COMPUTATION_FAILURE = 'CELO_PNP_ERR_06 Failed to compute BLS signature',
  DUPLICATE_REQUEST_TO_MATCHMAKE = 'CELO_PNP_ERR_08 Attempt to request >1 matchmaking',
}

export function respondWithError(res: Response, statusCode: number, error: string) {
  res.status(statusCode).json({ success: false, error })
}
