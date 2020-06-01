import BigNumber from 'bignumber.js'

export const DEV_MODE = process.env.NODE_ENV !== 'production'

export const DEV_PUBLIC_KEY =
  'B+gJTCmTrf9t3X7YQ2F4xekSzd5xg5bdzcJ8NPefby3mScelg5172zl1GgIO9boADEwE67j6M55GwouQwaG5jDZ5tHa2eNtfC7oLIsevuUmzrXVDry9cmsalB0BHX0EA'
export const DEV_PRIVATE_KEY = '1DNeOAuBYhR9BIKKChUOatB1Ha6cK/sG9p7XT2tjYQ8='

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

const env = process.env as any
const config: Config = {
  server: {
    port: env.server_port,
  },
  blockchain: {
    provider: env.blockchain_provider,
  },
  salt: {
    unverifiedQueryMax: env.salt_unverified_query_max,
    additionalVerifiedQueryMax: env.salt_additional_verified_query_max,
    queryPerTransaction: env.salt_query_per_transaction,
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
    numberAttestationsRequired: env.attestations_number_attestations_required,
  },
}
export default config
