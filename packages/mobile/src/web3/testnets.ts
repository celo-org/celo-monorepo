import Config from 'react-native-config'

export enum Testnets {
  integration = 'integration',
  appintegration = 'appintegration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  pilotstaging = 'pilotstaging',
}

export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET
