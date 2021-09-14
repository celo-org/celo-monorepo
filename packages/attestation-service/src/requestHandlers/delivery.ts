import express from 'express'
import { ErrorMessages, respondWithError } from '../request'
import { SmsService } from '../sms'

export function handleAttestationDeliveryStatus(smsService: SmsService, providerType: string) {
  return async (_req: express.Request, res: express.Response) => {
    const provider = smsService.smsProviderOfType(providerType)

    if (provider === undefined) {
      respondWithError(res, 422, ErrorMessages.NO_PROVIDER_SETUP)
      return
    }

    await provider!.receiveDeliveryStatusReport(_req, res.locals.logger)
    res.json({ success: true }).status(200)
  }
}
