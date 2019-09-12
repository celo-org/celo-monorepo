import * as _ from 'lodash'
import { AsyncStorage } from 'react-native'
import { generateMnemonic, wordlists } from 'react-native-bip39'
import { getKey, setKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'

const TAG = 'Backup/utils'
const MNEMONIC_SPLITS = 2

export async function createQuizWordList(mnemonic: string, language: string | null) {
  const disallowedWordSet = new Set(mnemonic.split(' '))
  const languageWordList = getWordlist(language)
  const wordOptions: string = await generateMnemonic(1000, null, languageWordList)
  return wordOptions.split(' ').filter((word: string) => !disallowedWordSet.has(word))
}

export function selectQuizWordOptions(
  mnemonic: string,
  allWords: string[],
  numOptions: number
): [string, string[]] | [] {
  const correctWord = _.sample(mnemonic.split(' '))

  if (!correctWord) {
    // mnemonic is empty
    return []
  }

  const wordOptions = _.chain(allWords)
    .sampleSize(numOptions - 1)
    .push(correctWord)
    .shuffle()
    .value()

  return [correctWord, wordOptions]
}

export function getWordlist(language: string | null): string[] {
  switch (language) {
    case 'es': {
      return wordlists.ES
    }
    default: {
      return wordlists.EN
    }
  }
}

function getPrefixWords(wordlist: string[], numWords: number): string[] {
  // Use random words in sorted order for split phrase prefixes. While BIP39
  // does not avoid repeating words, the prefixes MUST be unique otherwise it is
  // not possible to differentiate parts.  Prefixes are just used as a way to
  // determine which mnemonic shard corresponds to which half
  const prefixes = _.chain(wordlist)
    .sampleSize(numWords)
    .uniq()
    .value()
    .sort()

  if (prefixes.length < numWords) {
    throw new Error('Word list has duplicate words')
  }

  return prefixes
}

export function splitMnemonic(mnemonic: string, language: string | null): string[] {
  const mnemonicWords = mnemonic.split(' ')

  const wordlist = getWordlist(language)
  const prefixes = getPrefixWords(wordlist, MNEMONIC_SPLITS)

  const chunkSize = Math.ceil(mnemonicWords.length / MNEMONIC_SPLITS)
  return _.chunk(mnemonicWords, chunkSize).map((words, i) => [prefixes[i], ...words].join(' '))
}

// Sort function based on the first word in string arrays. Mnemonic prefixes are
// the first word in each shard
function sortStringArray(a: string[], b: string[]): number {
  // localeCompare is slower -- https://jsperf.com/operator-vs-localecompage/3
  if (a[0] < b[0]) {
    return -1
  }

  if (a[0] > b[0]) {
    return 1
  }

  return 0
}

export function joinMnemonic(mnemonicShards: string[]) {
  return mnemonicShards
    .map((shard) => shard.split(' '))
    .sort(sortStringArray)
    .map((shard) => shard.slice(1).join(' '))
    .join(' ')
}

// TODO(Rossy) Remove after the next alfa testnet reset
export async function getStoredMnemonic(): Promise<string | null> {
  try {
    Logger.debug(TAG, 'Checking keystore for mnemonic')
    let mnemonic = await getKey('mnemonic')
    if (mnemonic) {
      return mnemonic
    }

    Logger.debug(TAG, 'Mnemonic not found in keystore, checking async storage')
    mnemonic = await AsyncStorage.getItem('mnemonic')
    if (mnemonic) {
      await setKey('mnemonic', mnemonic)
      await AsyncStorage.removeItem('mnemonic')
      return mnemonic
    }

    Logger.error(TAG, 'No mnemonic found')
    return null
  } catch (error) {
    Logger.error(TAG, 'Failed to retrieve mnemonic', error)
    return null
  }
}
