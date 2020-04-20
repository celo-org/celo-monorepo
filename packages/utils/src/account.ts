import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
// tslint:disable-next-line: no-duplicate-imports
import { wordlists } from 'bip39' // Unify the wordlists (otherwise depends on the instance of the bip39)
import randomBytes from 'randombytes'

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

const bip39Wrapper: Bip39 = {
  mnemonicToSeedSync: bip39.mnemonicToSeedSync,
  mnemonicToSeed: bip39.mnemonicToSeed,
  generateMnemonic: (
    strength?: number,
    rng?: (size: number, callback: (err: Error | null, buf: Buffer) => void) => void,
    wordlist?: string[]
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      strength = strength || 128
      rng = rng || randomBytes

      rng(strength / 8, (error, randomBytesBuffer) => {
        if (error) {
          reject(error)
        } else {
          resolve(bip39.entropyToMnemonic(randomBytesBuffer.toString('hex'), wordlist))
        }
      })
    })
  },
  validateMnemonic: bip39.validateMnemonic,
}

interface Bip39 {
  mnemonicToSeedSync: (mnemonic: string, password?: string) => Buffer
  mnemonicToSeed: (mnemonic: string, password?: string) => Promise<Buffer>
  generateMnemonic: (
    strength?: number,
    rng?: (size: number) => Buffer,
    wordlist?: string[]
  ) => Promise<string>
  validateMnemonic: (mnemonic: string, wordlist?: string[]) => boolean
}

export async function generateMnemonic(
  strength: MnemonicStrength = MnemonicStrength.s256_24words,
  language?: MnemonicLanguages,
  bip39ToUse: Bip39 = bip39Wrapper
): Promise<string> {
  return bip39ToUse.generateMnemonic(strength, undefined, getWordList(language))
}

export function validateMnemonic(
  mnemonic: string,
  language?: MnemonicLanguages,
  bip39ToUse: Bip39 = bip39Wrapper
) {
  return bip39ToUse.validateMnemonic(mnemonic, getWordList(language))
}

export async function generateKeys(
  mnemonic: string,
  password?: string,
  addressIndex: number = 0,
  bip39ToUse: Bip39 = bip39Wrapper
): Promise<{ privateKey: string; publicKey: string }> {
  const seed = await bip39ToUse.mnemonicToSeed(mnemonic, password)
  const node = bip32.fromSeed(seed)
  const newNode = node.derivePath(`${CELO_DERIVATION_PATH_BASE}/${addressIndex}`)
  return {
    privateKey: newNode.privateKey!.toString('hex'),
    publicKey: newNode.publicKey.toString('hex'),
  }
}

export function generateKeysSync(
  mnemonic: string,
  password?: string,
  addressIndex: number = 0,
  bip39ToUse: Bip39 = bip39Wrapper
): { privateKey: string; publicKey: string } {
  const seed = bip39ToUse.mnemonicToSeedSync(mnemonic, password)
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
      return wordlists.chinese_simplified
    case MnemonicLanguages.chinese_traditional:
      return wordlists.chinese_traditional
    case MnemonicLanguages.english:
      return wordlists.english
    case MnemonicLanguages.french:
      return wordlists.french
    case MnemonicLanguages.italian:
      return wordlists.italian
    case MnemonicLanguages.japanese:
      return wordlists.japanese
    case MnemonicLanguages.korean:
      return wordlists.korean
    case MnemonicLanguages.spanish:
      return wordlists.spanish
    default:
      return wordlists.english
  }
}

export const AccountUtils = {
  generateMnemonic,
  validateMnemonic,
  generateKeys,
  generateKeysSync,
}
