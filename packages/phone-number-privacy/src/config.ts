import dotenv from 'dotenv'
const functions = require('firebase-functions')
export const functionConfig = functions.config()

// Load environment variables from .env file
dotenv.config()

export const PHONE_NUMBER_PRIVACY_SECRET_KEY =
  (process.env.SECRET_KEY as string) || functionConfig.envs.secret_key // config.envs used when deployed to firebase
console.log(functionConfig)
