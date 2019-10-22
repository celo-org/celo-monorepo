import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { mockMnemonic } from 'test/values'

it('renders correctly', () => {
  const tree = renderer.create(<BackupPhraseContainer words={mockMnemonic} />)
  expect(tree).toMatchSnapshot()
})
