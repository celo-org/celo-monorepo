import BigNumber from 'bignumber.js'

export const DEV_MODE = process.env.NODE_ENV !== 'production'

export const DEV_PUBLIC_KEY =
  'T4u+jDHnBnWoe+c6JQ1Q47a0p2SCTbLb6DblnS0tnpzkebgP63T0RyAaYRCRmBsAE6421jwKcVRzVypCsmILPpHQ6MErykqoQ3WuCHd38PTIRWoolrmT1Wh8Z5dw6S6A'
export const DEV_PRIVATE_KEY = 'AAAAAGq0qzUlgXAYOb7IDBvUiktHC/IaDAdkwnF4TzLRkQAN'
export const DEV_POLYNOMIAL =
  'AQAAAAAAAABPi76MMecGdah75zolDVDjtrSnZIJNstvoNuWdLS2enOR5uA/rdPRHIBphEJGYGwATrjbWPApxVHNXKkKyYgs+kdDowSvKSqhDda4Id3fw9MhFaiiWuZPVaHxnl3DpLoA='

export enum SupportedKeystore {
  AzureKeyVault = 'AzureKeyVault',
  GoogleSecretManager = 'GoogleSecretManager',
  AWSSecretManager = 'AWSSecretManager',
}

interface Config {
  server: {
    port: string | number
  }
  salt: {
    unverifiedQueryMax: number
    additionalVerifiedQueryMax: number
    queryPerTransaction: number
    minDollarBalance: BigNumber
  }
  attestations: {
    numberAttestationsRequired: number
  }
  blockchain: {
    provider: string
  }
  db: {
    user: string
    password: string
    database: string
    host: string
  }
  keystore: {
    type: SupportedKeystore
    azure: {
      clientID: string
      clientSecret: string
      tenant: string
      vaultName: string
      secretName: string
    }
    google: {
      projectId: string
      secretName: string
      secretVersion: string
    }
    aws: {
      region: string
      secretName: string
      secretKey: string
    }
  }
}

const toNum = (value: BigNumber.Value) => new BigNumber(value).toNumber()

const env = process.env as any
const config: Config = {
  server: {
    port: toNum(env.SERVER_PORT) || 8080,
  },
  salt: {
    unverifiedQueryMax: toNum(env.SALT_UNVERIFIED_QUERY_MAX) || 2,
    additionalVerifiedQueryMax: toNum(env.SALT_ADDITIONAL_VERIFIED_QUERY_MAX) || 30,
    queryPerTransaction: toNum(env.SALT_QUERY_PER_TRANSACTION) || 2,
    minDollarBalance: new BigNumber(env.SALT_MIN_DOLLAR_BALANCE || 100000000000000000),
  },
  attestations: {
    numberAttestationsRequired: toNum(env.ATTESTATIONS_NUMBER_ATTESTATIONS_REQUIRED) || 3,
  },
  blockchain: {
    provider: env.BLOCKCHAIN_PROVIDER,
  },
  db: {
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    host: env.DB_HOST,
  },
  keystore: {
    type: env.KEYSTORE_TYPE,
    azure: {
      clientID: env.KEYSTORE_AZURE_CLIENT_ID,
      clientSecret: env.KEYSTORE_AZURE_CLIENT_SECRET,
      tenant: env.KEYSTORE_AZURE_TENANT,
      vaultName: env.KEYSTORE_AZURE_VAULT_NAME,
      secretName: env.KEYSTORE_AZURE_SECRET_NAME,
    },
    google: {
      projectId: env.KEYSTORE_GOOGLE_PROJECT_ID,
      secretName: env.KEYSTORE_GOOGLE_SECRET_NAME,
      secretVersion: env.KEYSTORE_GOOGLE_SECRET_VERSION || 'latest',
    },
    aws: {
      region: env.KEYSTORE_AWS_REGION,
      secretName: env.KEYSTORE_AWS_SECRET_NAME,
      secretKey: env.KEYSTORE_AWS_SECRET_KEY || 'key',
    },
  },
}
export default config
