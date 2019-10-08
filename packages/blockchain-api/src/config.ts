import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const EXCHANGE_RATES_API = (process.env.EXCHANGE_RATES_API as string).toLowerCase()
export const BLOCKSCOUT_API = (process.env.BLOCKSCOUT_API as string).toLowerCase()
export const FAUCET_ADDRESS = (process.env.FAUCET_ADDRESS as string).toLowerCase()
export const VERIFICATION_REWARDS_ADDRESS = (process.env
  .VERIFICATION_REWARDS_ADDRESS as string).toLowerCase()
export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL
