import { OdisUtils } from '@celo/contractkit-extenders'
import {
  DEFAULT_SYNC_MODE,
  DEFAULT_TESTNET,
  FORNO_ENABLED_INITIALLY,
  GETH_USE_FULL_NODE_DISCOVERY,
  GETH_USE_STATIC_NODES,
} from 'src/config'
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
  odisUrl: string // Phone Number Privacy service url
  odisPubKey: string
  signMoonpayUrl: string
  useDiscovery: boolean
  useStaticNodes: boolean
}

const odisUrlStaging = OdisUtils.Query.ODIS_ALFAJORESSTAGING_CONTEXT.odisUrl
const odisPubKeyStaging = OdisUtils.Query.ODIS_ALFAJORESSTAGING_CONTEXT.odisPubKey

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
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://alfajoresstaging-dot-celo-testnet.wl.r.appspot.com/',
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com/',
    odisUrl: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_ALFAJORES_CONTEXT.odisPubKey,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilot-dot-celo-testnet-production.appspot.com/',
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://pilotstaging-dot-celo-testnet.appspot.com/',
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.baklavastaging]: {
    nodeDir: `.${Testnets.baklavastaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklavastaging-dot-celo-testnet.appspot.com/',
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.baklava]: {
    nodeDir: `.${Testnets.baklava}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://baklava-dot-celo-testnet-production.appspot.com/',
    odisUrl: odisUrlStaging,
    odisPubKey: odisPubKeyStaging,
    signMoonpayUrl: signMoonpayUrlStaging,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
  [Testnets.mainnet]: {
    nodeDir: `.${Testnets.mainnet}`,
    syncMode: DEFAULT_SYNC_MODE,
    initiallyForno: FORNO_ENABLED_INITIALLY,
    blockchainApiUrl: 'https://blockchain-api-dot-celo-mobile-mainnet.appspot.com/',
    odisUrl: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisUrl,
    odisPubKey: OdisUtils.Query.ODIS_MAINNET_CONTEXT.odisPubKey,
    signMoonpayUrl: signMoonpayUrlProd,
    useDiscovery: GETH_USE_FULL_NODE_DISCOVERY,
    useStaticNodes: GETH_USE_STATIC_NODES,
  },
}

Logger.info('Connecting to testnet: ', DEFAULT_TESTNET)

export default networkConfigs[DEFAULT_TESTNET]
