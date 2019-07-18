import Config from 'react-native-config'

export enum Testnets {
  integration = 'integration',
  appintegration = 'appintegration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
}

export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET
