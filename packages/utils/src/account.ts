import {
  Bip39,
  CELO_DERIVATION_PATH_BASE,
  MnemonicLanguages,
  MnemonicStrength,
  RandomNumberGenerator,
} from '@celo/base/lib/account'
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
  changeIndex: number = 0,
  addressIndex: number = 0,
  bip39ToUse: Bip39 = bip39Wrapper,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): Promise<{ privateKey: string; publicKey: string; address: string }> {
  const seed: Buffer = await generateSeed(mnemonic, password, bip39ToUse)
  return generateKeysFromSeed(seed, changeIndex, addressIndex, derivationPath)
}

export function generateDeterministicInviteCode(
  pepper: string,
  changeIndex: number = 0,
  addressIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): { privateKey: string; publicKey: string } {
  const seed = keccak256(pepper) as Buffer
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
    default:
      return bip39.wordlists.english
  }
}

export const AccountUtils = {
  generateMnemonic,
  validateMnemonic,
  generateKeys,
  generateSeed,
  generateKeysFromSeed,
}
