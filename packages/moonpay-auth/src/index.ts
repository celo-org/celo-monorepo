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

// TODO: This staging function is left in place to test the cUSD integration
// that we are waiting on from Moonpay. It will be removed after
// cUSD is added and tested
export const signMoonpayStaging = functions.https.onRequest((request, response) => {
  const fiatCurrency = request.body.fiatCurrency || 'USD'
  let fiatAmount = request.body.fiatAmount || '20'
  if (parseFloat(fiatAmount) < 20) {
    fiatAmount = '20' // Minimum order of 20, else Moonpay prefills to 200
  }
  const url =
    MOONPAY_URL_STAGING +
    '?apiKey=' +
    MOONPAY_PUBLIC_KEY_STAGING +
    '&currencyCode=' +
    request.body.currency +
    '&walletAddress=' +
    request.body.address +
    '&baseCurrencyCode=' +
    fiatCurrency +
    '&baseCurrencyAmount=' +
    fiatAmount
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
  const fiatCurrency = request.body.fiatCurrency || 'USD'
  let fiatAmount = request.body.fiatAmount || '20'
  if (parseFloat(fiatAmount) < 20) {
    fiatAmount = '20' // Minimum order of 20, else Moonpay prefills to 200
  }
  const url =
    MOONPAY_URL_PROD +
    '?apiKey=' +
    MOONPAY_PUBLIC_KEY_PROD +
    '&currencyCode=' +
    request.body.currency +
    '&walletAddress=' +
    request.body.address +
    '&baseCurrencyCode=' +
    fiatCurrency +
    '&baseCurrencyAmount=' +
    fiatAmount
  console.log(`Requested signature for: ${url}`)

  const signature = crypto
    .createHmac('sha256', MOONPAY_SECRET_KEY_PROD)
    .update(new URL(url).search)
    .digest('base64')

  const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`
  console.log(`Returning signed URL: ${urlWithSignature}`)
  response.send(JSON.stringify({ url: urlWithSignature }))
})
