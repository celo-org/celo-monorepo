import BigNumber from 'bignumber.js'
import * as functions from 'firebase-functions'
import Web3 from 'web3'
import logger from './common/logger'

export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

export const DEV_PUBLIC_KEY =
  'T4u+jDHnBnWoe+c6JQ1Q47a0p2SCTbLb6DblnS0tnpzkebgP63T0RyAaYRCRmBsAE6421jwKcVRzVypCsmILPpHQ6MErykqoQ3WuCHd38PTIRWoolrmT1Wh8Z5dw6S6A'
export const DEV_PRIVATE_KEY = 'AAAAAGq0qzUlgXAYOb7IDBvUiktHC/IaDAdkwnF4TzLRkQAN'
export const DEV_POLYNOMIAL =
  'AQAAAAAAAABPi76MMecGdah75zolDVDjtrSnZIJNstvoNuWdLS2enOR5uA/rdPRHIBphEJGYGwATrjbWPApxVHNXKkKyYgs+kdDowSvKSqhDda4Id3fw9MhFaiiWuZPVaHxnl3DpLoA='

export interface PgpnpServices {
  url: string
}
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
  pgpnpServices: PgpnpServices[]
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
    pgpnpServices: [
      // {
      //   url: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net',
      // },
      {
        url: 'http://localhost:3000',
      },
    ],
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
    pgpnpServices: [],
    thresholdSignature: {
      threshold: functionConfig.threshold_signature.threshold_signature_threshold,
      polynomial: functionConfig.threshold_signature.threshold_polynomial,
    },
  }
}
export default config
