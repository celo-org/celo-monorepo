import * as bip39 from 'bip39'

export class ReactNativeBip39MnemonicGenerator {
  static generateMnemonic(): string {
    // Strength of 128 generates 12-word mnemonic.
    // Strength of 256 generates 24-word mnemonic which the mobile wallet app uses.
    return bip39.generateMnemonic(256)
  }

  // Simply calling "bip39.mnemonicToSeedHex(mnemonic)" won't work.
  // bip39 generates 64-character password - https://github.com/bitcoinjs/bip39/blob/07c06c09115570636c3dfde676418cf46a45f774/src/index.js#L46
  // react-native-bip39 used by the mobile wallet app generates 32-character password - https://github.com/celo-org/react-native-bip39/blob/1488fa18a482809732b3c50ec989d56d5c539a6b/index.js#L15
  // Turns out that the first 32-characters of that match.
  static mnemonicToSeedHex(mnemonic: string, password?: string): string {
    // Since this is hex encoded, first 32 characters == first 64 hex characters.
    return bip39.mnemonicToSeedHex(mnemonic, password).substr(0, 64)
  }
}
