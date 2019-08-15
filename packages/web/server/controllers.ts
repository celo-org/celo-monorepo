import { Request, Response } from 'express'
import captchaVerify from './captchaVerify'
import { RequestStatus, RequestType } from './FirebaseClient'
import { sendRequest } from './FirebaseServerSide'

export async function faucetOrInviteController(req: Request, res: Response, type: RequestType) {
  const { captchaToken, beneficiary } = req.body
  const captchaResponse = await captchaVerify(captchaToken)
  if (captchaResponse.success) {
    const key = await sendRequest(beneficiary, type)
    res.status(200).json({ status: RequestStatus.Pending, key })
  } else {
    res.status(401).json({ status: RequestStatus.Failed })
  }
}
