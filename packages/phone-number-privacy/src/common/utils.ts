import { Response } from 'firebase-functions'

export enum ErrorMessages {
  DATABASE_UPDATE_FAILURE = 'CELO_PNP_ERR_01 Failed to update database entry',
  DATABASE_INSERT_FAILURE = 'CELO_PNP_ERR_02 Failed to insert database entry',
  DATABASE_GET_FAILURE = 'CELO_PNP_ERR_03 Failed to get databse entry',
  INVALID_INPUT = 'CELO_PNP_ERR_04 Invalid input paramaters',
  EXCEEDED_QUOTA = 'CELO_PNP_ERR_05 Requester exceeded salt service query quota',
  SALT_COMPUTATION_FAILURE = 'CELO_PNP_ERR_06 Failed to compute BLS salt',
  UNKNOWN_ERROR = 'CELO_PNP_ERR_07 Something went wrong',
}

export function respondWithError(res: Response, statusCode: number, error: string) {
  res.status(statusCode).json({ success: false, error })
}

export class HashSet<T> {
  public set: any = {}

  add(key: T) {
    this.set[key] = true
  }

  remove(key: T) {
    delete this.set[key]
  }

  clear() {
    this.set = {}
  }

  contains(key: T) {
    return this.set.hasOwnProperty(key)
  }
}

export function hashSetBuilder<T>(list: T[]): HashSet<T> {
  const hs = new HashSet()
  for (const item of list) {
    hs.add(item)
  }
  return hs
}
