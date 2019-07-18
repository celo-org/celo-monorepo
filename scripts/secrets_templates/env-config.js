const environments = {
  development: {
    BASE_URL: 'https://dev.celo.org',
    FAUCET: true,
    FIREBASE_CONFIG: {
      apiKey: 'AIzaSyC90HNy5ChMhQhcgBpFaDC_eJ10BRtAGNI',
      authDomain: 'celo-faucet.firebaseapp.com',
      databaseURL: 'https://celo-faucet.firebaseio.com',
      projectId: 'celo-faucet',
    },
    V3: true,
    __SEGMENT_KEY__: 'REPLACE_ME',
  },
  production: {
    BASE_URL: 'https://celo.org',
    FAUCET: false,
    V3: true,
    __SEGMENT_KEY__: 'REPLACE_ME',
  },
  staging: {
    BASE_URL: 'https://staging.celo.org',
    FAUCET: true,
    V3: true,
    __SEGMENT_KEY__: 'REPLACE_ME',
  },
}

module.exports = environments[process.env.DEPLOY_ENV]
