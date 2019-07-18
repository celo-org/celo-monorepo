import { SYNC_MODE_ULTRALIGHT } from 'src/geth/consts'
import { Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.appintegration]: {
    nodeDir: `.${Testnets.appintegration}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
}
