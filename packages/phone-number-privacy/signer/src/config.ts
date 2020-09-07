import { toBool, toNum } from '@celo/phone-number-privacy-common'
import BigNumber from 'bignumber.js'

require('dotenv').config()

export function getVersion(): string {
  return process.env.npm_package_version ? process.env.npm_package_version : '0.0.0'
}
export const DEV_MODE = process.env.NODE_ENV !== 'production'

export const DEV_PUBLIC_KEY =
  '1f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'
export const DEV_PRIVATE_KEY =
  '00000000dd0005bf4de5f2f052174f5cf58dae1af1d556c7f7f85d6fb3656e1d0f10720f'
export const DEV_POLYNOMIAL =
  '01000000000000001f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'

export enum SupportedDatabase {
  Postgres = 'postgres', // PostgresSQL
  MySql = 'mysql', // MySQL
  MsSql = 'mssql', // Microsoft SQL Server
}

export enum SupportedKeystore {
  AzureKeyVault = 'AzureKeyVault',
  GoogleSecretManager = 'GoogleSecretManager',
  AWSSecretManager = 'AWSSecretManager',
  MockSecretManager = 'MockSecretManager',
}

interface Config {
  server: {
    port: string | number
    sslKeyPath?: string
    sslCertPath?: string
  }
  quota: {
    unverifiedQueryMax: number
    additionalVerifiedQueryMax: number
    queryPerTransaction: number
    minDollarBalance: BigNumber
    minCeloBalance: BigNumber
  }
  attestations: {
    numberAttestationsRequired: number
  }
  blockchain: {
    provider: string
  }
  db: {
    type: SupportedDatabase
    user: string
    password: string
    database: string
    host: string
    port?: number
    ssl: boolean
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

const env = process.env as any
const config: Config = {
  server: {
    port: toNum(env.SERVER_PORT) || 8080,
    sslKeyPath: env.SERVER_SSL_KEY_PATH,
    sslCertPath: env.SERVER_SSL_CERT_PATH,
  },
  quota: {
    unverifiedQueryMax: toNum(env.UNVERIFIED_QUERY_MAX) || 2,
    additionalVerifiedQueryMax: toNum(env.ADDITIONAL_VERIFIED_QUERY_MAX) || 30,
    queryPerTransaction: toNum(env.QUERY_PER_TRANSACTION) || 2,
    // Min balance is .01 cUSD
    minDollarBalance: new BigNumber(env.MIN_DOLLAR_BALANCE || 1e16),
    // Min balance is .005 CELO
    minCeloBalance: new BigNumber(env.MIN_DOLLAR_BALANCE || 5e15),
  },
  attestations: {
    numberAttestationsRequired: toNum(env.ATTESTATIONS_NUMBER_ATTESTATIONS_REQUIRED) || 3,
  },
  blockchain: {
    provider: env.BLOCKCHAIN_PROVIDER,
  },
  db: {
    type: env.DB_TYPE ? env.DB_TYPE.toLowerCase() : SupportedDatabase.Postgres,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    host: env.DB_HOST,
    port: env.DB_PORT ? toNum(env.DB_PORT) : undefined,
    ssl: toBool(env.DB_USE_SSL, true),
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
      secretKey: env.KEYSTORE_AWS_SECRET_KEY,
    },
  },
}
export default config
