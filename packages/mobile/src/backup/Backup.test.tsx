import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { Backup } from 'src/backup/Backup'

describe('Backup', () => {
  it('renders correctly if backup not completed', () => {
    const tree = renderer.create(
      <Backup
        language={'en'}
        setBackupCompleted={jest.fn()}
        setBackupDelayed={jest.fn()}
        enterBackupFlow={jest.fn()}
        exitBackupFlow={jest.fn()}
        backupCompleted={false}
        backupTooLate={true}
        backupDelayedTime={0}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly if backup completed', () => {
    const tree = renderer.create(
      <Backup
        language={'en'}
        setBackupCompleted={jest.fn()}
        setBackupDelayed={jest.fn()}
        enterBackupFlow={jest.fn()}
        exitBackupFlow={jest.fn()}
        backupCompleted={true}
        backupTooLate={false}
        backupDelayedTime={0}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
