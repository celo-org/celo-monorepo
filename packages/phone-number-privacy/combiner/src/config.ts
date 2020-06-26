import BigNumber from 'bignumber.js'
import * as functions from 'firebase-functions'
import Web3 from 'web3'
import logger from './common/logger'

export const VERSION = process.env.npm_package_version
export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

export const DEV_PUBLIC_KEY =
  '1f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'
export const DEV_PRIVATE_KEY =
  '00000000dd0005bf4de5f2f052174f5cf58dae1af1d556c7f7f85d6fb3656e1d0f10720f'
export const DEV_POLYNOMIAL =
  '01000000000000001f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'

interface Config {
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
    ssl: boolean
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
  pgpnpServices: {
    signers: string
    timeoutMilliSeconds: number
  }
  thresholdSignature: {
    threshold: number
    polynomial: string
  }
}

let config: Config

if (DEV_MODE) {
  logger.debug('Running in dev mode')
  config = {
    blockchain: {
      provider: 'https://alfajores-forno.celo-testnet.org',
    },
    salt: {
      unverifiedQueryMax: 2,
      additionalVerifiedQueryMax: 30,
      queryPerTransaction: 2,
      minDollarBalance: new BigNumber(Web3.utils.toWei('0.1')),
    },
    db: {
      user: 'postgres',
      password: 'fakePass',
      database: 'phoneNumberPrivacy',
      host: 'fakeHost',
      ssl: !DEV_MODE,
    },
    keyVault: {
      azureClientID: 'useMock',
      azureClientSecret: 'useMock',
      azureTenant: 'useMock',
      azureVaultName: 'useMock',
      azureSecretName: 'useMock',
    },
    attestations: {
      numberAttestationsRequired: 3,
    },
    pgpnpServices: {
      signers: '[{"url": "http://localhost:3000"}]',
      timeoutMilliSeconds: 5 * 1000,
    },
    thresholdSignature: {
      threshold: 1,
      polynomial: DEV_POLYNOMIAL,
    },
  }
} else {
  const functionConfig = functions.config()
  config = {
    blockchain: {
      provider: functionConfig.blockchain.provider,
    },
    salt: {
      unverifiedQueryMax: functionConfig.salt.unverified_query_max,
      additionalVerifiedQueryMax: functionConfig.salt.additional_verified_query_max,
      queryPerTransaction: functionConfig.salt.query_per_transaction,
      minDollarBalance: new BigNumber(functionConfig.salt.min_dollar_balance),
    },
    db: {
      user: functionConfig.db.username,
      password: functionConfig.db.pass,
      database: functionConfig.db.name,
      host: `/cloudsql/${functionConfig.db.host}`,
      ssl: !DEV_MODE,
    },
    keyVault: {
      azureClientID: functionConfig.keyvault.azure_client_id,
      azureClientSecret: functionConfig.keyvault.azure_client_secret,
      azureTenant: functionConfig.keyvault.azure_tenant,
      azureVaultName: functionConfig.keyvault.azure_vault_name,
      azureSecretName: functionConfig.keyvault.azure_secret_name,
    },
    attestations: {
      numberAttestationsRequired: functionConfig.attestations.number_attestations_required,
    },
    pgpnpServices: {
      signers: functionConfig.pgpnpservices.signers,
      timeoutMilliSeconds: functionConfig.pgpnpservices.timeoutMilliSeconds || 5 * 1000,
    },
    thresholdSignature: {
      threshold: functionConfig.threshold_signature.threshold_signature_threshold,
      polynomial: functionConfig.threshold_signature.threshold_polynomial,
    },
  }
}
export default config
