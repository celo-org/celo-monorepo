import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupComplete from 'src/backup/BackupComplete'

describe('BackupComplete', () => {
  it('renders correctly if backup not completed', () => {
    const tree = renderer.create(<BackupComplete mnemonic={'foo bar'} onPress={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly if backup completed', () => {
    const tree = renderer.create(
      <BackupComplete mnemonic={'foo bar'} onPress={jest.fn()} backupCompleted={true} />
    )
    expect(tree).toMatchSnapshot()
  })
})
