import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupQuestion from 'src/backup/BackupQuestion'

const SAMPLE_WORDS = ['prosper', 'winner', 'rhythm', 'trust']
const CORRECT_WORD = 'trust'
const QUESTION_NUMBER = 1
const INDICES_TO_TEST = [0, 1, 2, 3, 5]

it('renders correctly on 1st question', () => {
  const tree = renderer.create(
    <BackupQuestion
      questionNumber={QUESTION_NUMBER}
      testWordIndex={INDICES_TO_TEST[0]}
      words={SAMPLE_WORDS}
      correctAnswer={CORRECT_WORD}
      onReturnToPhrase={jest.fn()}
      onCorrectSubmit={jest.fn()}
      onWrongSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly on 2nd word', () => {
  const tree = renderer.create(
    <BackupQuestion
      questionNumber={QUESTION_NUMBER}
      testWordIndex={INDICES_TO_TEST[1]}
      words={SAMPLE_WORDS}
      correctAnswer={CORRECT_WORD}
      onReturnToPhrase={jest.fn()}
      onCorrectSubmit={jest.fn()}
      onWrongSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly on 3rd word', () => {
  const tree = renderer.create(
    <BackupQuestion
      questionNumber={QUESTION_NUMBER}
      testWordIndex={INDICES_TO_TEST[2]}
      words={SAMPLE_WORDS}
      correctAnswer={CORRECT_WORD}
      onReturnToPhrase={jest.fn()}
      onCorrectSubmit={jest.fn()}
      onWrongSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly on 3rd word', () => {
  const tree = renderer.create(
    <BackupQuestion
      questionNumber={QUESTION_NUMBER}
      testWordIndex={INDICES_TO_TEST[3]}
      words={SAMPLE_WORDS}
      correctAnswer={CORRECT_WORD}
      onReturnToPhrase={jest.fn()}
      onCorrectSubmit={jest.fn()}
      onWrongSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly on 3rd word', () => {
  const tree = renderer.create(
    <BackupQuestion
      questionNumber={QUESTION_NUMBER}
      testWordIndex={INDICES_TO_TEST[4]}
      words={SAMPLE_WORDS}
      correctAnswer={CORRECT_WORD}
      onReturnToPhrase={jest.fn()}
      onCorrectSubmit={jest.fn()}
      onWrongSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})
