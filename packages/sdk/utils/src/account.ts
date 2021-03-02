import {
  Bip39,
  CELO_DERIVATION_PATH_BASE,
  MnemonicLanguages,
  MnemonicStrength,
  RandomNumberGenerator,
} from '@celo/base/lib/account'
import { normalizeAccents } from '@celo/base/lib/string'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import { keccak256 } from 'ethereumjs-util'
import randomBytes from 'randombytes'
import { privateKeyToAddress } from './address'
// Exports moved to @celo/base, forwarding them
// here for backwards compatibility
export {
  Bip39,
  CELO_DERIVATION_PATH_BASE,
  MnemonicLanguages,
  MnemonicStrength,
  RandomNumberGenerator,
} from '@celo/base/lib/account'

function defaultGenerateMnemonic(
  strength?: number,
  rng?: RandomNumberGenerator,
  wordlist?: string[]
): Promise<string> {
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
}

const bip39Wrapper: Bip39 = {
  mnemonicToSeedSync: bip39.mnemonicToSeedSync,
  mnemonicToSeed: bip39.mnemonicToSeed,
  generateMnemonic: defaultGenerateMnemonic,
  validateMnemonic: bip39.validateMnemonic,
}

export async function generateMnemonic(
  strength: MnemonicStrength = MnemonicStrength.s256_24words,
  language?: MnemonicLanguages,
  bip39ToUse: Bip39 = bip39Wrapper
): Promise<string> {
  return bip39ToUse.generateMnemonic(strength, undefined, getWordList(language))
}

export function validateMnemonic(mnemonic: string, bip39ToUse: Bip39 = bip39Wrapper) {
  const languages = getAllLanguages()
  for (const language of languages) {
    if (bip39ToUse.validateMnemonic(mnemonic, getWordList(language))) {
      return true
    }
  }

  return false
}

export function formatNonAccentedCharacters(mnemonic: string) {
  const languages = getAllLanguages()
  const normMnemonicArr = normalizeAccents(mnemonic)
    .toLowerCase()
    .trim()
    .split(' ')

  for (const language of languages) {
    if (isLatinBasedLanguage(language)) {
      const wordList = getWordList(language)
      const normWordListMap = createNormalizedWordListMap(wordList)
      const languageMatches = arrayContainedInMap(normMnemonicArr, normWordListMap)

      if (languageMatches) {
        return replaceIncorrectlyAccentedWords(mnemonic, normMnemonicArr, normWordListMap)
      }
    }
  }

  return mnemonic
}

const createNormalizedWordListMap = (wordList: string[]) => {
  const normWordListMap = new Map()
  for (const word of wordList) {
    const noramlizedWord = normalizeAccents(word)
    normWordListMap.set(noramlizedWord, word)
  }
  return normWordListMap
}

const arrayContainedInMap = (array: string[], map: Map<string, string>) => {
  for (const item of array) {
    if (!map.has(item)) {
      return false
    }
  }
  return true
}

const replaceIncorrectlyAccentedWords = (
  mnemonic: string,
  normMnemonicArr: string[],
  normWordListMap: Map<string, string>
) => {
  const mnemonicArr = [...mnemonic.trim().split(' ')]
  for (let i = 0; i < normMnemonicArr.length; i += 1) {
    const noramlizedWord = normMnemonicArr[i]
    const nonNormalizedWord = normWordListMap.get(noramlizedWord)

    if (nonNormalizedWord) {
      mnemonicArr[i] = nonNormalizedWord
    }
  }

  return mnemonicArr.join(' ')
}

export async function generateKeys(
  mnemonic: string,
  password?: string,
  changeIndex: number = 0,
  addressIndex: number = 0,
  bip39ToUse: Bip39 = bip39Wrapper,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): Promise<{ privateKey: string; publicKey: string; address: string }> {
  const seed: Buffer = await generateSeed(mnemonic, password, bip39ToUse)
  return generateKeysFromSeed(seed, changeIndex, addressIndex, derivationPath)
}

export function generateDeterministicInviteCode(
  recipientPhoneHash: string,
  recipientPepper: string,
  addressIndex: number = 0,
  changeIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): { privateKey: string; publicKey: string } {
  const seed = keccak256(recipientPhoneHash + recipientPepper) as Buffer
  return generateKeysFromSeed(seed, changeIndex, addressIndex, derivationPath)
}

// keyByteLength truncates the seed. *Avoid its use*
// It was added only because a backwards compatibility bug
export async function generateSeed(
  mnemonic: string,
  password?: string,
  bip39ToUse: Bip39 = bip39Wrapper,
  keyByteLength: number = 64
): Promise<Buffer> {
  let seed: Buffer = await bip39ToUse.mnemonicToSeed(mnemonic, password)
  if (keyByteLength > 0 && seed.byteLength > keyByteLength) {
    const bufAux = Buffer.allocUnsafe(keyByteLength)
    seed.copy(bufAux, 0, 0, keyByteLength)
    seed = bufAux
  }
  return seed
}

export function generateKeysFromSeed(
  seed: Buffer,
  changeIndex: number = 0,
  addressIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): { privateKey: string; publicKey: string; address: string } {
  const node = bip32.fromSeed(seed)
  const newNode = node.derivePath(`${derivationPath}/${changeIndex}/${addressIndex}`)
  if (!newNode.privateKey) {
    // As we are generating the node from a seed, the node will always have a private key and this would never happened
    throw new Error('utils-accounts@generateKeys: invalid node to derivate')
  }
  return {
    privateKey: newNode.privateKey.toString('hex'),
    publicKey: newNode.publicKey.toString('hex'),
    address: privateKeyToAddress(newNode.privateKey.toString('hex')),
  }
}

function isLatinBasedLanguage(language: MnemonicLanguages) {
  if (
    language === MnemonicLanguages.chinese_simplified ||
    language === MnemonicLanguages.chinese_traditional ||
    language === MnemonicLanguages.japanese ||
    language === MnemonicLanguages.korean
  ) {
    return false
  }
  return true
}

// Unify the bip39.wordlists (otherwise depends on the instance of the bip39)
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
    case MnemonicLanguages.portuguese:
      return bip39.wordlists.portuguese
    default:
      return bip39.wordlists.english
  }
}

function getAllLanguages() {
  return [
    MnemonicLanguages.chinese_simplified,
    MnemonicLanguages.chinese_traditional,
    MnemonicLanguages.english,
    MnemonicLanguages.french,
    MnemonicLanguages.italian,
    MnemonicLanguages.japanese,
    MnemonicLanguages.korean,
    MnemonicLanguages.spanish,
    MnemonicLanguages.portuguese,
  ]
}

export const AccountUtils = {
  generateMnemonic,
  validateMnemonic,
  generateKeys,
  generateSeed,
  generateKeysFromSeed,
}
