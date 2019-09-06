import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const CONTRACT_SYMBOL_MAPPING: { [key: string]: string } = {
  // GOLD_CONTRACT_ADDRESS
  [(process.env.CELO_GOLD_ADDRESS as string).toLowerCase()]: 'Celo Gold',
  // DOLLAR_CONTRACT_ADDRESS
  [(process.env.CELO_DOLLAR_ADDRESS as string).toLowerCase()]: 'Celo Dollar',
}

export const EXCHANGE_RATES_API = (process.env.EXCHANGE_RATES_API as string).toLowerCase()
export const BLOCKSCOUT_API = (process.env.BLOCKSCOUT_API as string).toLowerCase()
export const FAUCET_ADDRESS = (process.env.FAUCET_ADDRESS as string).toLowerCase()
export const VERIFICATION_REWARDS_ADDRESS = (process.env
  .VERIFICATION_REWARDS_ADDRESS as string).toLowerCase()
export const ATTESTATIONS_ADDRESS = (process.env.ATTESTATIONS_ADDRESS as string).toLowerCase()
