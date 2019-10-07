import { DEFAULT_SYNC_MODE, DEFAULT_TESTNET } from 'src/web3/testnets'

export default {
  [DEFAULT_TESTNET]: {
    nodeDir: `.${DEFAULT_TESTNET}`,
    syncMode: DEFAULT_SYNC_MODE,
  },
}
