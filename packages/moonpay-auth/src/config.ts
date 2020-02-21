const functions = require('firebase-functions')
export const config = functions.config()

export const MOONPAY_URL = 'https://buy-staging.moonpay.io/'
export const MOONPAY_SECRET_KEY =
  (process.env.MOONPAY_SECRET_KEY as string) || config.envs.secret_key // config.envs used when deployed to firebase
export const MOONPAY_PUBLIC_KEY =
  (process.env.MOONPAY_PUBLIC_KEY as string) || config.envs.public_key
