import express from 'express'
import { doHealthCheck } from '../db'
import { ErrorMessages, respondWithError } from '../request'

export async function handleLivenessRequest(_req: express.Request, res: express.Response) {
  try {
    const failureReason = await doHealthCheck()
    if (failureReason) {
      respondWithError(res, 500, failureReason)
    } else {
      res.json({ status: 'live' }).status(200)
    }
  } catch (error) {
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
