import express from 'express'
import { isAttestationSignerUnlocked, isDBOnline } from '../db'
import { ErrorMessages, respondWithError } from '../request'

export async function handleLivenessRequest(_req: express.Request, res: express.Response) {
  try {
    if (!(await isAttestationSignerUnlocked())) {
      respondWithError(res, 401, ErrorMessages.ATTESTATION_SIGNER_CANNOT_SIGN)
      return
    }

    try {
      await isDBOnline()
    } catch (error) {
      respondWithError(res, 504, ErrorMessages.DATABASE_IS_OFFLONE)
      return
    }

    res.json({ status: 'live' }).status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
