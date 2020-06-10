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
    port: toNum(env.server_port),
  },
  blockchain: {
    provider: env.blockchain_provider,
  },
  salt: {
    unverifiedQueryMax: toNum(env.salt_unverified_query_max),
    additionalVerifiedQueryMax: toNum(env.salt_additional_verified_query_max),
    queryPerTransaction: toNum(env.salt_query_per_transaction),
    minDollarBalance: new BigNumber(env.salt_min_dollar_balance),
  },
  db: {
    user: env.db_username,
    password: env.db_password,
    database: env.db_database,
    host: env.db_host,
  },
  keyVault: {
    azureClientID: env.keyvault_azure_client_id,
    azureClientSecret: env.keyvault_azure_client_secret,
    azureTenant: env.keyvault_azure_tenant,
    azureVaultName: env.keyvault_azure_vault_name,
    azureSecretName: env.keyvault_azure_secret_name,
  },
  attestations: {
    numberAttestationsRequired: toNum(env.attestations_number_attestations_required),
  },
}
export default config
