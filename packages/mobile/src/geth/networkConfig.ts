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
}

interface NetworkConfig {
  nodeDir: string
  syncMode: GethSyncMode
  initiallyForno: boolean
  blockchainApiUrl: string
  pgpnpUrl: string // Phone Number Privacy service url
  pgpnpPubKey: string
}

const pgpnpUrlStaging = 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
const pgpnpPubKeyStaging =
  'B+gJTCmTrf9t3X7YQ2F4xekSzd5xg5bdzcJ8NPefby3mScelg5172zl1GgIO9boADEwE67j6M55GwouQwaG5jDZ5tHa2eNtfC7oLIsevuUmzrXVDry9cmsalB0BHX0EA'
const pgpnpUrlProd = 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
const pgpnpPubKeyProd =
  '6VFX/ufxvL54NDRlJMe0jlbb9wD3L/Kfm6K2qEKoxrDMS42Q1S7ZOH88tdpOJhcAJPdDTjGE6qHQBiV48n/jctSuOJ8HjsRzp6VJWMHW3imqep7nwyhzNfLcPXJfrngB'

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://integration-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://alfajoresstaging-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://alfajores-dot-celo-testnet-production.appspot.com/',
    pgpnpUrl: pgpnpUrlProd,
    pgpnpPubKey: pgpnpPubKeyProd,
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilot-dot-celo-testnet-production.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilotstaging-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
  [Testnets.baklavastaging]: {
    nodeDir: `.${Testnets.baklavastaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklavastaging-dot-celo-testnet.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
  [Testnets.baklava]: {
    nodeDir: `.${Testnets.baklava}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklava-dot-celo-testnet-production.appspot.com/',
    pgpnpUrl: pgpnpUrlStaging,
    pgpnpPubKey: pgpnpPubKeyStaging,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
