import * as crypto from 'crypto'
import * as functions from 'firebase-functions'
import { config, MOONPAY_PUBLIC_KEY, MOONPAY_SECRET_KEY, MOONPAY_URL } from './config'
const URL = require('url').URL

export const signMoonpay = functions.https.onRequest((request, response) => {
  console.log(
    `Public key is ${MOONPAY_PUBLIC_KEY}, secret key is ${MOONPAY_SECRET_KEY}, URL is ${MOONPAY_URL}`
  )
  console.log(config)
  const url =
    MOONPAY_URL +
    '?apiKey=' +
    MOONPAY_PUBLIC_KEY +
    '&currencyCode=' +
    request.body.currency +
    '&walletAddress=' +
    request.body.address +
    '&baseCurrencyCode=' +
    request.body.fiatCurrency
  console.log(`Requested signature for: ${url}`)
  const signature = crypto
    .createHmac('sha256', MOONPAY_SECRET_KEY)
    .update(new URL(url).search)
    .digest('base64')

  const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`
  console.log(`Returning signed URL: ${urlWithSignature}`)
  response.send(JSON.stringify({ url: urlWithSignature }))
})
