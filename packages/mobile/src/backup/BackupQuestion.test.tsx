import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupQuestion from 'src/backup/BackupQuestion'

const SAMPLE_WORDS = ['prosper', 'winner', 'rhythm', 'trust']
const CORRECT_WORD = 'trust'

it('renders correctly', () => {
  const tree = renderer.create(
    <BackupQuestion
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
