import express from 'express'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { CELO_ENV } from './celoEnv'
import { configDummy } from './configDummy'
import { releaseRewardsLock, tryAcquireRewardsLock } from './database'
import { deleteRewardedMessages, distributeAllPendingRewards } from './rewards'
import { parseBase64, validateRequest } from './validation'
import { disableInactiveVerifers, sendSmsCode } from './verification'

admin.initializeApp()
const app = express()
app.use(express.json())

app.post('/v0.1/sms/', async (req: express.Request, res: express.Response) => {
  console.info('Post request received at /v0.1/sms/')
  try {
    const account: string = req.body.account
    const phoneNumber: string = req.body.phoneNumber
    const message: string = req.body.message
    const issuer: string = req.body.issuer

    const isValid = await validateRequest(
      phoneNumber,
      parseBase64(account),
      parseBase64(message),
      parseBase64(issuer)
    )

    if (!isValid) {
      console.error(`Error - invalid request: ${JSON.stringify(req.body)}`)
      res.status(401).json({ error: 'Invalid Request' })
      return
    }

    const messageId = await sendSmsCode(parseBase64(account), phoneNumber, message)
    res.json({ messageId })
  } catch (e) {
    console.error('Failed to send sms', e)
    res.status(500).send('Something went wrong')
  }
})

app.post('/v0.1/rewards/', async (req: express.Request, res: express.Response) => {
  console.info('Post request received at /v0.1/rewards/')
  if (!(await tryAcquireRewardsLock())) {
    console.info('Could not acquire lock, pool already rewarding.')
    res.json({ success: true })
    return
  }
  try {
    await distributeAllPendingRewards()
    await deleteRewardedMessages()
    await disableInactiveVerifers()
    await releaseRewardsLock()
    res.json({ success: true })
  } catch (e) {
    console.error('Failed to distribute rewards', e)
    await releaseRewardsLock()
    res.status(500).send('Unable to distribute rewards')
  }
})

declare var exports: any
exports[`handleVerificationRequest${CELO_ENV}`] = functions.https.onRequest(app)
exports[`configDummy`] = configDummy
