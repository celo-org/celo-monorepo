import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupPhrase from 'src/backup/BackupPhrase'

const SAMPLE_PHRASE =
  'prosper winner find donate tape history measure umbrella agent patrol want rhythm old unable wash wrong need fluid hammer coach reveal plastic trust lake'

it('renders correctly with backup not completed', () => {
  const tree = renderer.create(
    <BackupPhrase
      backupCompleted={false}
      words={SAMPLE_PHRASE}
      onPressBackup={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with backup completed', () => {
  const tree = renderer.create(
    <BackupPhrase
      backupCompleted={true}
      words={SAMPLE_PHRASE}
      onPressBackup={jest.fn()}
      onCancel={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})
