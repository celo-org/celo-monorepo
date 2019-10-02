import { GethSyncMode } from 'src/geth/consts'

import Config from 'react-native-config'

export enum Testnets {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  pilot = 'pilot',
  pilotstaging = 'pilotstaging',
}

export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET
export const DEFAULT_SYNC_MODE: GethSyncMode = parseInt(Config.DEFAULT_SYNC_MODE, 10)
