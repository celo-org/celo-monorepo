import { generateMnemonic, MnemonicLanguages, MnemonicStrength } from '@celo/utils/src/account'
import * as _ from 'lodash'
import * as bip39 from 'react-native-bip39'
import { getKey } from 'src/utils/keyStore'
import Logger from 'src/utils/Logger'

const TAG = 'Backup/utils'

export const DAYS_TO_BACKUP = 1
export const DAYS_TO_DELAY = 1 / 24 // 1 hour delay
export const MNEMONIC_SPLITTER = 'celo'

export async function createQuizWordList(mnemonic: string, language: string | null) {
  const disallowedWordSet = new Set(mnemonic.split(' '))
  const languageWordList = getWordlist(language)
  const wordOptions: string = await generateMnemonic(
    MnemonicStrength.s256_24words,
    languageWordList,
    bip39
  )
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

export function getWordlist(language: string | null) {
  if (!language) {
    return MnemonicLanguages.english
  }

  switch (language.slice(0, 2)) {
    case 'es': {
      return MnemonicLanguages.spanish
    }
    default: {
      return MnemonicLanguages.english
    }
  }
}

// Split a mnemonic into two and insert the mnemonic splitter in between
export function splitMnemonic(mnemonic: string, language: string | null): string[] {
  // TODO use language to i18n the splitter word? For now just using 'celo' everywhere

  if (!mnemonic) {
    throw new Error('Cannot split invalid mnemonic')
  }

  const mnemonicWords = mnemonic.split(' ')
  const firstHalf = [...mnemonicWords.slice(0, mnemonicWords.length / 2), MNEMONIC_SPLITTER]
  const secondHalf = [MNEMONIC_SPLITTER, ...mnemonicWords.slice(mnemonicWords.length / 2)]
  return [firstHalf.join(' '), secondHalf.join(' ')]
}

export function joinMnemonic(mnemonicShards: string[]) {
  if (
    !mnemonicShards ||
    !(mnemonicShards.length === 2) ||
    !mnemonicShards[0].includes(MNEMONIC_SPLITTER) ||
    !mnemonicShards[1].includes(MNEMONIC_SPLITTER)
  ) {
    throw new Error('Cannot join invalid mnemonic shards')
  }

  if (mnemonicShards[0].startsWith(MNEMONIC_SPLITTER)) {
    mnemonicShards.reverse()
  }

  const [firstHalf, secondHalf] = mnemonicShards.map((shard) => shard.split(' '))
  return [...firstHalf.slice(0, firstHalf.length - 1), ...secondHalf.slice(1)].join(' ')
}

export async function getStoredMnemonic(): Promise<string | null> {
  try {
    Logger.debug(TAG, 'Checking keystore for mnemonic')
    const mnemonic = await getKey('mnemonic')

    if (!mnemonic) {
      throw new Error('No mnemonic found in storage')
    }

    return mnemonic
  } catch (error) {
    Logger.error(TAG, 'Failed to retrieve mnemonic', error)
    return null
  }
}

// Because of a RN bug, we can't fully clean the text as the user types
// https://github.com/facebook/react-native/issues/11068
export function formatBackupPhraseOnEdit(phrase: string) {
  return phrase.replace(/\s+/gm, ' ')
}

// Note(Ashish) The wordlists seem to use NFD and contains lower-case words for English and Spanish.
// I am not sure if the words are lower-case for Japanese as well but I am assuming that for now.
export function formatBackupPhraseOnSubmit(phrase: string) {
  return formatBackupPhraseOnEdit(phrase)
    .trim()
    .normalize('NFD')
    .toLocaleLowerCase()
}

function isValidMnemonic(phrase: string, length: number) {
  return (
    !!phrase &&
    formatBackupPhraseOnEdit(phrase)
      .trim()
      .split(/\s+/g).length === length
  )
}

export function isValidBackupPhrase(phrase: string) {
  return isValidMnemonic(phrase, 24)
}

export function isValidSocialBackupPhrase(phrase: string) {
  return isValidMnemonic(phrase, 13)
}
