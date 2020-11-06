import { NativeModules } from 'react-native'

NativeModules.RNSecureRandom = {
  generateSecureRandomAsBase64: jest.fn().mockImplementation(async (_) => 'AAECAwQFBgcICQ=='),
}

module.exports = {
  ...jest.requireActual('react-native-securerandom'),
}
