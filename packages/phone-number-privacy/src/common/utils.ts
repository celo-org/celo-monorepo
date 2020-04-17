import { Response } from 'firebase-functions'

export enum ErrorMessages {
  DATABASE_UPDATE_FAILURE = 'Failed to update database entry',
  DATABASE_INSERT_FAILURE = 'Failed to insert database entry',
  DATABASE_GET_FAILURE = 'Failed to get databse entry',
  INVALID_INPUT = 'Invalid input paramaters',
  EXCEEDED_QUOTA = 'Requester exceeded salt service query quota',
  SALT_COMPUTATION_FAILURE = 'Failed to compute BLS salt',
  UNKNOWN_ERROR = 'Something went wrong',
}

export function respondWithError(res: Response, statusCode: number, error: string) {
  res.status(statusCode).json({ success: false, error })
}
