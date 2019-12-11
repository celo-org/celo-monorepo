import dotenv from 'dotenv'
import secrets from './secrets.json'

// Load environment variables from .env file
dotenv.config()

function getSecrets(deployEnv: string) {
  const envSecrets = (secrets as any)[deployEnv]
  if (!envSecrets) {
    console.warn(`No secrets found for deploy env ${deployEnv}`)
    return {}
  }

  return envSecrets
}

export const DEPLOY_ENV = (process.env.DEPLOY_ENV as string).toLowerCase()
export const EXCHANGE_RATES_API = (process.env.EXCHANGE_RATES_API as string).toLowerCase()
export const { EXCHANGE_RATES_API_ACCESS_KEY } = getSecrets(DEPLOY_ENV)
export const BLOCKSCOUT_API = (process.env.BLOCKSCOUT_API as string).toLowerCase()
export const FAUCET_ADDRESS = (process.env.FAUCET_ADDRESS as string).toLowerCase()
export const VERIFICATION_REWARDS_ADDRESS = (process.env
  .VERIFICATION_REWARDS_ADDRESS as string).toLowerCase()
export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL
