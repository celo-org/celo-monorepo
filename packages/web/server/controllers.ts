import { Request, Response } from 'express'
import { RequestStatus, RequestType } from '../src/fauceting/FaucetInterfaces'
import captchaVerify from './captchaVerify'
import { sendRequest } from './FirebaseServerSide'

export async function faucetOrInviteController(req: Request, res: Response, type: RequestType) {
  const { captchaToken, beneficiary, mobileOS } = req.body
  const captchaResponse = await captchaVerify(captchaToken)
  if (captchaResponse.success) {
    try {
      const key = await sendRequest(beneficiary, type, mobileOS)
      res.status(200).json({ status: RequestStatus.Pending, key })
    } catch (error) {
      res.status(404).json({ status: RequestStatus.Failed, message: 'Error while fauceting' })
    }
  } else {
    res.status(401).json({ status: RequestStatus.Failed })
  }
}
