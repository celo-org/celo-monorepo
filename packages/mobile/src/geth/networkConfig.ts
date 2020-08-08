import { DEFAULT_SYNC_MODE, DEFAULT_TESTNET, FORNO_ENABLED_INITIALLY } from 'src/config'
import { GethSyncMode } from 'src/geth/consts'
import Logger from 'src/utils/Logger'

export enum Testnets {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  pilot = 'pilot',
  pilotstaging = 'pilotstaging',
  baklavastaging = 'baklavastaging',
  baklava = 'baklava',
  mainnet = 'mainnet',
}

interface NetworkConfig {
  nodeDir: string
  syncMode: GethSyncMode
  initiallyForno: boolean
  blockchainApiUrl: string
  pgpnpUrl: string // Phone Number Privacy service url
  pgpnpPubKey: string
  signMoonpayUrl: string
}

const pgpnpUrlStaging = 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
const pgpnpPubKeyStaging =
  '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA'

const signMoonpayUrlStaging =
  'https://us-central1-celo-org-mobile.cloudfunctions.net/signMoonpayStaging'
const signMoonpayUrlProd =
  'https://us-central1-celo-mobile-mainnet.cloudfunctions.net/signMoonpayProd'

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://integration-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://alfajoresstaging-dot-celo-testnet.wl.r.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com/',
    pgpnpUrl: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net',
    pgpnpPubKey:
      'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilot-dot-celo-testnet-production.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilotstaging-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.baklavastaging]: {
    nodeDir: `.${Testnets.baklavastaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklavastaging-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.baklava]: {
    nodeDir: `.${Testnets.baklava}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklava-dot-celo-testnet-production.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
  },
  [Testnets.mainnet]: {
    nodeDir: `.${Testnets.mainnet}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com/',
    pgpnpUrl: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net',
    pgpnpPubKey:
      'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
    signMoonpayUrl: signMoonpayUrlProd,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
