import BigNumber from 'bignumber.js'
import * as functions from 'firebase-functions'
import logger from './common/logger'

export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

const CUSD_VALUE = 1000000000000000000
interface Config {
  blockchain: {
    provider: string
  }
  salt: {
    key: string
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
  attestations: {
    numberAttestationsRequired: number
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
      key: 'pknJzIYf4LPbOPao5lk1tVwljmXAddyebYsQ3wI5ywk=',
      unverifiedQueryMax: 2,
      additionalVerifiedQueryMax: 30,
      queryPerTransaction: 2,
      minDollarBalance: new BigNumber(0.1 * CUSD_VALUE),
    },
    db: {
      user: 'postgres',
      password: 'fakePass',
      database: 'phoneNumberPrivacy',
      host: 'fakeHost',
    },
    attestations: {
      numberAttestationsRequired: 3,
    },
  }
} else {
  const functionConfig = functions.config()
  config = {
    blockchain: {
      provider: functionConfig.blockchain.provider,
    },
    salt: {
      key: functionConfig.salt.key,
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
    attestations: {
      numberAttestationsRequired: functionConfig.attestations.number_attestations_required,
    },
  }
  logger.debug('Using function config: ', { ...config, salt: { ...config.salt, key: 'mockKey' } })
}
export default config
