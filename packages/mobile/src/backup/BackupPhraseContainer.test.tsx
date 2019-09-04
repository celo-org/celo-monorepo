import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'

const WORDS =
  'tuna assault reward enjoy quit trash eyebrow spatial core south pilot wall sample swim humor over garlic charge mix radio sudden transfer mirror wide'

it('renders correctly', () => {
  const tree = renderer.create(<BackupPhraseContainer words={WORDS} />)
  expect(tree).toMatchSnapshot()
})
