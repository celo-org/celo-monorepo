import crypto from 'crypto'
import * as functions from 'firebase-functions'
import {
  MOONPAY_PUBLIC_KEY_PROD,
  MOONPAY_PUBLIC_KEY_STAGING,
  MOONPAY_SECRET_KEY_PROD,
  MOONPAY_SECRET_KEY_STAGING,
  MOONPAY_URL_PROD,
  MOONPAY_URL_STAGING,
} from './config'
const URL = require('url').URL

export const signMoonpayStaging = functions.https.onRequest((request, response) => {
  const url =
    MOONPAY_URL_STAGING +
    '?apiKey=' +
    MOONPAY_PUBLIC_KEY_STAGING +
    '&currencyCode=' +
    request.body.currency +
    '&walletAddress=' +
    request.body.address +
    '&baseCurrencyCode=' +
    request.body.fiatCurrency +
    '&baseCurrencyAmount=' +
    request.body.fiatAmount
  console.log(`Requested signature for: ${url}`)

  const signature = crypto
    .createHmac('sha256', MOONPAY_SECRET_KEY_STAGING)
    .update(new URL(url).search)
    .digest('base64')

  const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`
  console.log(`Returning signed URL: ${urlWithSignature}`)
  response.send(JSON.stringify({ url: urlWithSignature }))
})

export const signMoonpayProd = functions.https.onRequest((request, response) => {
  console.log(`Public key (non sensitive): ${MOONPAY_PUBLIC_KEY_PROD}`)
  const url =
    MOONPAY_URL_PROD +
    '?apiKey=' +
    MOONPAY_PUBLIC_KEY_PROD +
    '&currencyCode=' +
    request.body.currency +
    '&walletAddress=' +
    request.body.address +
    '&baseCurrencyCode=' +
    request.body.fiatCurrency +
    '&baseCurrencyAmount=' +
    request.body.fiatAmount
  console.log(`Requested signature for: ${url}`)

  const signature = crypto
    .createHmac('sha256', MOONPAY_SECRET_KEY_PROD)
    .update(new URL(url).search)
    .digest('base64')

  const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`
  console.log(`Returning signed URL: ${urlWithSignature}`)
  response.send(JSON.stringify({ url: urlWithSignature }))
})
