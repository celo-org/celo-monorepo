import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
export const CELO_DERIVATION_PATH_BASE = "m/44'/52752'/0'/0"

export enum MnemonicStrength {
  s128_12words = 128,
  s256_24words = 256,
}

export enum MnemonicLanguages {
  chinese_simplified,
  chinese_traditional,
  english,
  french,
  italian,
  japanese,
  korean,
  spanish,
}

export function generateMnemonic(
  strength: MnemonicStrength = MnemonicStrength.s256_24words,
  language?: MnemonicLanguages
): string {
  return bip39.generateMnemonic(strength, undefined, getWordList(language))
}

export function generateKeys(
  mnemonic: string,
  password?: string,
  addressIndex: number = 0
): { privateKey: string; publicKey: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic, password)
  const node = bip32.fromSeed(seed)
  const newNode = node.derivePath(`${CELO_DERIVATION_PATH_BASE}/${addressIndex}`)
  return {
    privateKey: newNode.privateKey!.toString('hex'),
    publicKey: newNode.publicKey.toString('hex'),
  }
}

function getWordList(language?: MnemonicLanguages) {
  switch (language) {
    case MnemonicLanguages.chinese_simplified:
      return bip39.wordlists.chinese_simplified
    case MnemonicLanguages.chinese_traditional:
      return bip39.wordlists.chinese_traditional
    case MnemonicLanguages.english:
      return bip39.wordlists.english
    case MnemonicLanguages.french:
      return bip39.wordlists.french
    case MnemonicLanguages.italian:
      return bip39.wordlists.italian
    case MnemonicLanguages.japanese:
      return bip39.wordlists.japanese
    case MnemonicLanguages.korean:
      return bip39.wordlists.korean
    case MnemonicLanguages.spanish:
      return bip39.wordlists.spanish
    default:
      return bip39.wordlists.english
  }
}
