import { AddressType } from '@celo/utils/lib/io'
import express from 'express'
import * as t from 'io-ts'
import { ErrorMessages, respondWithError } from '../request'
import { blacklistRegionCodes, configuredSmsProviders } from '../sms'
import { getAccountAddress } from './attestation'

export const StatusResponseType = t.type({
  status: t.literal('ok'),
  smsProviders: t.array(t.string),
  blacklistedRegionCodes: t.array(t.string),
  accountAddress: AddressType,
})

export async function handleStatusRequest(_req: express.Request, res: express.Response) {
  try {
    res
      .json(
        StatusResponseType.encode({
          status: 'ok',
          smsProviders: configuredSmsProviders(),
          blacklistedRegionCodes: blacklistRegionCodes(),
          accountAddress: getAccountAddress(),
        })
      )
      .status(200)
  } catch (error) {
    console.error(error)
    respondWithError(res, 500, ErrorMessages.UNKNOWN_ERROR)
  }
}
