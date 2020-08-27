import express from 'express'
import { ErrorMessages, respondWithError } from '../request'
import { smsProviderOfType } from '../sms'

export function handleAttestationDeliveryStatus(providerType: string) {
  return async (_req: express.Request, res: express.Response) => {
    const provider = smsProviderOfType(providerType)

    if (provider === undefined) {
      respondWithError(res, 422, ErrorMessages.NO_PROVIDER_SETUP)
      return
    }

    await provider!.receiveDeliveryStatusReport(_req)
    res.json({ success: true }).status(200)
  }
}
