import BigNumber from 'bignumber.js'

export const DEV_MODE = process.env.NODE_ENV !== 'production'

export const DEV_PUBLIC_KEY =
  'T4u+jDHnBnWoe+c6JQ1Q47a0p2SCTbLb6DblnS0tnpzkebgP63T0RyAaYRCRmBsAE6421jwKcVRzVypCsmILPpHQ6MErykqoQ3WuCHd38PTIRWoolrmT1Wh8Z5dw6S6A'
export const DEV_PRIVATE_KEY = 'AAAAAGq0qzUlgXAYOb7IDBvUiktHC/IaDAdkwnF4TzLRkQAN'
export const DEV_POLYNOMIAL =
  'AQAAAAAAAABPi76MMecGdah75zolDVDjtrSnZIJNstvoNuWdLS2enOR5uA/rdPRHIBphEJGYGwATrjbWPApxVHNXKkKyYgs+kdDowSvKSqhDda4Id3fw9MhFaiiWuZPVaHxnl3DpLoA='

interface Config {
  server: {
    port: string | number
  }
  blockchain: {
    provider: string
  }
  salt: {
    unverifiedQueryMax: number
    additionalVerifiedQueryMax: number
    queryPerTransaction: number
    minDollarBalance: BigNumber
  }
  db: {
    user: string
    password: string
    database: string
    host: string
  }
  keyVault: {
    azureClientID: string
    azureClientSecret: string
    azureTenant: string
    azureVaultName: string
    azureSecretName: string
  }
  attestations: {
    numberAttestationsRequired: number
  }
}

const toNum = (value: BigNumber.Value) => new BigNumber(value).toNumber()

const env = process.env as any
const config: Config = {
  server: {
    port: toNum(env.SERVER_PORT),
  },
  blockchain: {
    provider: env.BLOCKCHAIN_PROVIDER,
  },
  salt: {
    unverifiedQueryMax: toNum(env.SALT_UNVERIFIED_QUERY_MAX),
    additionalVerifiedQueryMax: toNum(env.SALT_ADDITIONAL_VERIFIED_QUERY_MAX),
    queryPerTransaction: toNum(env.SALT_QUERY_PER_TRANSACTION),
    minDollarBalance: new BigNumber(env.SALT_MIN_DOLLAR_BALANCE),
  },
  db: {
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    host: env.DB_HOST,
  },
  keyVault: {
    azureClientID: env.KEYVAULT_AZURE_CLIENT_ID,
    azureClientSecret: env.KEYVAULT_AZURE_CLIENT_SECRET,
    azureTenant: env.KEYVAULT_AZURE_TENANT,
    azureVaultName: env.KEYVAULT_AZURE_VAULT_NAME,
    azureSecretName: env.KEYVAULT_AZURE_SECRET_NAME,
  },
  attestations: {
    numberAttestationsRequired: toNum(env.ATTESTATIONS_NUMBER_ATTESTATIONS_REQUIRED),
  },
}
export default config
