import { sampleSize } from 'lodash'
import { generateMnemonic, wordlists } from 'react-native-bip39'

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
  const randomWordIndexList = sampleSize([...Array(allWords.length).keys()], numOptions - 1)
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
