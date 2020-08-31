import express from 'express'
import { getAgeOfLatestBlock, isAttestationSignerUnlocked, isDBOnline, isNodeSyncing } from '../db'
import { ErrorMessages, respondWithError } from '../request'

export async function handleLivenessRequest(_req: express.Request, res: express.Response) {
  try {
    if (!(await isAttestationSignerUnlocked())) {
      respondWithError(res, 401, ErrorMessages.ATTESTATION_SIGNER_CANNOT_SIGN)
      return
    }

    if (await isNodeSyncing()) {
      respondWithError(res, 504, ErrorMessages.NODE_IS_SYNCING)
      return
    }

    const { ageOfLatestBlock } = await getAgeOfLatestBlock()
    if (ageOfLatestBlock > 30) {
      respondWithError(res, 504, ErrorMessages.NODE_IS_STUCK)
      return
    }

    try {
      await isDBOnline()
    } catch (error) {
      respondWithError(res, 504, ErrorMessages.DATABASE_IS_OFFLINE)
      return
    }

    res.json({ status: 'live' }).status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
