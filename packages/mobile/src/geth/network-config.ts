import { SYNC_MODE_ULTRALIGHT } from 'src/geth/consts'
import { Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
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
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
}
