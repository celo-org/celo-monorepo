import dotenv from 'dotenv'
dotenv.config()

export const PRIVATE_KEY = process.env.PK
export const WITHDRAWAL_TX_HASH = process.env.TX_HASH
export const NETWORK = process.env.NETWORK
export const L1_RPC_URL = process.env.L1_RPC_URL
export const L2_RPC_URL = process.env.L2_RPC_URL
