// Note: The contents of this file are sent to the browser.
// Don't put anything here which you are not comfortable exposing to the world.
const FLAGS = require('./flags')

const SENTRY = {
  KEY: '3bda909f88a6414783aa458168f32f22',
  PROJECT: '1543594',
}

const FIREBASE_CONFIG = {
  PRODUCTION: {
    apiKey: 'AIzaSyC90HNy5ChMhQhcgBpFaDC_eJ10BRtAGNI',
    authDomain: 'celo-faucet.firebaseapp.com',
    databaseURL: 'https://celo-faucet.firebaseio.com',
    projectId: 'celo-faucet',
  },
  STAGING: {
    apiKey: 'AIzaSyCS-f1oCwYsaQH9k3tIPAZqcnbbecw3azs',
    authDomain: 'celo-faucet-staging.firebaseapp.com',
    databaseURL: 'https://celo-faucet-staging.firebaseio.com',
    projectId: 'celo-faucet-staging',
  },
}

const environments = {
  development: {
    BASE_URL: 'https://dev.celo.org',
    BLOCKSCOUT: {
      uri: 'https://baklava-blockscout.celo-testnet.org/graphiql',
      baklava: 'https://baklava-blockscout.celo-testnet.org/graphiql',
      baklavastaging: 'https://baklavastaging-blockscout.celo-testnet.org/graphiql',
      mainnet: 'https://explorer.celo.org/graphiql',
    },
    ENV: 'development',
    FIREBASE_CONFIG: FIREBASE_CONFIG.STAGING,
    FLAGS: FLAGS,
    RECAPTCHA: '6Lfcxa0UAAAAAFJYxERmt6RHFbVcyqwHmOxmd03N',
    SENTRY: SENTRY,
    __SEGMENT_KEY__: 'jfYca18mDvfV8IAUdSYzUuPn7a668WrT',
  },
  production: {
    BASE_URL: 'https://celo.org',
    BLOCKSCOUT: {
      uri: 'https://baklava-blockscout.celo-testnet.org/graphiql',
      baklava: 'https://baklava-blockscout.celo-testnet.org/graphiql',
      baklavastaging: 'https://baklavastaging-blockscout.celo-testnet.org/graphiql',
      mainnet: 'https://explorer.celo.org/graphiql',
    },
    ENV: 'production',
    FIREBASE_CONFIG: FIREBASE_CONFIG.PRODUCTION,
    FLAGS: FLAGS,
    RECAPTCHA: '6Ldkyq0UAAAAANfTWdTnWS_isWXcV9PpHlleBoKP',
    SENTRY: SENTRY,
    __SEGMENT_KEY__: 'iMFgC7SpYuKMsB0BBNeDQ4Zby6yU8fga',
  },
  staging: {
    BASE_URL: 'https://staging.celo.org',
    BLOCKSCOUT: {
      uri: 'https://baklavastaging-blockscout.celo-testnet.org/graphiql',
      baklava: 'https://baklava-blockscout.celo-testnet.org/graphiql',
      baklavastaging: 'https://baklavastaging-blockscout.celo-testnet.org/graphiql',
      mainnet: 'https://explorer.celo.org/graphiql',
    },
    ENV: 'staging',
    FIREBASE_CONFIG: FIREBASE_CONFIG.PRODUCTION,
    FLAGS: FLAGS,
    RECAPTCHA: '6Lfcxa0UAAAAAFJYxERmt6RHFbVcyqwHmOxmd03N',
    SENTRY: SENTRY,
    __SEGMENT_KEY__: 'H5GRe5JfBa5weXgd3bK88YQf0zCfFS2X',
  },
}

module.exports = environments[process.env.DEPLOY_ENV]
