import * as functions from 'firebase-functions'

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!')
})

/*
import crypto from 'crypto'
  
const originalUrl =
  'https://buy-staging.moonpay.io?apiKey=pk_test_EDT0SRJUlsJezJUFGaVZIr8LuaTsF5NO&currencyCode=eth&walletAddress=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae'

const signature = crypto
  .createHmac('sha256', 'sk_test_f4eX8rbao56sR5gqBe34Nhco1DOmuf2b')
  .update(new URL(originalUrl).search)
  .digest('base64')

const urlWithSignature = `${originalUrl}&signature=${encodeURIComponent(signature)}`
~                                                                                     

*/
