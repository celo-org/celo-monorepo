import * as functions from 'firebase-functions'

export const DEV_MODE =
  process.env.NODE_ENV !== 'production' || process.env.FUNCTIONS_EMULATOR === 'true'

interface Config {
  blockchain: {
    provider: string
    blockscout: string
  }
  salt: {
    key: string
    unverifiedQueryMax: number
    additionalVerifiedQueryMax: number
    queryPerTransaction: number
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
  console.debug('Running in dev mode')
  config = {
    blockchain: {
      provider: 'https://alfajores-forno.celo-testnet.org',
      blockscout: 'https://alfajores-blockscout.celo-testnet.org',
    },
    salt: {
      key: 'fakeSecretKey',
      unverifiedQueryMax: 2,
      additionalVerifiedQueryMax: 30,
      queryPerTransaction: 2,
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
      blockscout: functionConfig.blockchain.blockscout,
    },
    salt: {
      key: functionConfig.salt.key,
      unverifiedQueryMax: functionConfig.salt.unverifiedQueryMax,
      additionalVerifiedQueryMax: functionConfig.salt.additionalVerifiedQueryMax,
      queryPerTransaction: functionConfig.salt.queryPerTransaction,
    },
    db: {
      user: functionConfig.db.username,
      password: functionConfig.db.pass,
      database: functionConfig.db.name,
      host: `/cloudsql/${functionConfig.db.host}`,
    },
    attestations: {
      numberAttestationsRequired: functionConfig.attestations.numberAttestationsRequired,
    },
  }
}
export default config
