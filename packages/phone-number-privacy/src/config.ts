const functions = require('firebase-functions')
export const functionConfig = functions.config()

export const PHONE_NUMBER_PRIVACY_SECRET_KEY = functionConfig.envs.secret_key
