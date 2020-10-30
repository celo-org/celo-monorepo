const functions = require('firebase-functions')
export const config = functions.config()

export const MOONPAY_URL_STAGING = 'https://buy-staging.moonpay.io/'
export const MOONPAY_SECRET_KEY_STAGING =
  (process.env.MOONPAY_SECRET_KEY_STAGING as string) || config.envs.secret_key_staging // config.envs used when deployed to firebase
export const MOONPAY_PUBLIC_KEY_STAGING =
  (process.env.MOONPAY_PUBLIC_KEY_STAGING as string) || config.envs.public_key_staging

export const MOONPAY_URL_PROD = 'https://buy.moonpay.io/'
export const MOONPAY_SECRET_KEY_PROD =
  (process.env.MOONPAY_SECRET_KEY_PROD as string) || config.envs.secret_key_prod // config.envs used when deployed to firebase
export const MOONPAY_PUBLIC_KEY_PROD =
  (process.env.MOONPAY_PUBLIC_KEY_PROD as string) || config.envs.public_key_prod
