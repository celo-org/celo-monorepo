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
  const quizWordList = new Set(
    [...wordOptions.split(' ')].filter((word: string) => !disallowedWordSet.has(word))
  )
  return [...quizWordList]
}

export function selectQuizWordOptions(correctWord: string, allWords: string[], numOptions: number) {
  const wordOptions = []
  const correctWordPosition = Math.floor(Math.random() * numOptions)
  const randomWordIndexList = _.sampleSize([...Array(allWords.length).keys()], numOptions - 1)
  let randomWordIndex: number = 0

  for (let i = 0; i < numOptions; i++) {
    if (i === correctWordPosition) {
      wordOptions.push(correctWord)
      continue
    }

    wordOptions.push(allWords[randomWordIndexList[randomWordIndex]])
    randomWordIndex += 1
  }
  return wordOptions
}

export function getWordlist(language: string | null) {
  let wordlist
  switch (language) {
    case 'es': {
      wordlist = wordlists.ES
      break
    }
    default: {
      wordlist = wordlists.EN
    }
  }
  return wordlist
}

function getPartitionWord(
  wordlist: string[],
  partitions: number,
  partitionIndex: number
): string | undefined {
  if (partitionIndex >= partitions) {
    throw new Error('Partition cannot be greater than number of partitions')
  }

  const chunkSize = Math.ceil(wordlist.length / partitions)
  return _.sample(_.chunk(wordlist, chunkSize)[partitionIndex])
}

export function splitMnemonic(mnemonic: string, language: string | null): string[] {
  const wordlist = getWordlist(language)
  const mnemonicWords = mnemonic.split(' ')
  const chunkSize = Math.ceil(mnemonicWords.length / MNEMONIC_SPLITS)
  return _.chunk(mnemonicWords, chunkSize).map((words, i) =>
    [getPartitionWord(wordlist, MNEMONIC_SPLITS, i), ...words].join(' ')
  )
}

function getPartitionNumber(word: string, wordlist: string[], partitions: number): number {
  // Since wordlist is alphabetical, sortedIndexOf can be used to binary search
  const index = _.sortedIndexOf(wordlist, word)
  const chunkSize = wordlist.length / partitions

  let partition = 0
  // Index has to be >= to chunkSize, to include the first element in next chunk
  while (index >= chunkSize * partition) {
    partition++
  }

  return partition
}

export function joinMnemonic(mnemonicShards: string[], language: string | null): string {
  const wordlist = getWordlist(language)
  return mnemonicShards
    .map((shard) => {
      const shardArray = shard.split(' ')
      return {
        partition: getPartitionNumber(shardArray[0], wordlist, MNEMONIC_SPLITS),
        words: shardArray.slice(1).join(' '),
      }
    })
    .sort((a, b) => a.partition - b.partition)
    .map((shard) => shard.words)
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
