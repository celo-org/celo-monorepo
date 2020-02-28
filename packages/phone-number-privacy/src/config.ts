import dotenv from 'dotenv'
const functions = require('firebase-functions')
export const functionConfig = functions.config()

// Load environment variables from .env file
dotenv.config()

export const PHONE_NUMBER_PRIVACY_SECRET_KEY =
  (process.env.SECRET_KEY as string) || functionConfig.envs.secret_key //TODO @aslawson what is best way to include private key to GCP?
console.log(functionConfig)
