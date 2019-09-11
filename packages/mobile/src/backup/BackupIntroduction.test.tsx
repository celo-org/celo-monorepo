import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'

describe('BackupIntroduction', () => {
  it('renders correctly when backup is not too late', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onBackup={jest.fn()}
        onSocialBackup={jest.fn()}
        backupCompleted={false}
        socialBackupCompleted={false}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={0}
        backupTooLate={false}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup completed and social backup not completed', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onBackup={jest.fn()}
        onSocialBackup={jest.fn()}
        backupCompleted={true}
        socialBackupCompleted={false}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={0}
        backupTooLate={false}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup completed and social backup completed', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onBackup={jest.fn()}
        onSocialBackup={jest.fn()}
        backupCompleted={true}
        socialBackupCompleted={true}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={0}
        backupTooLate={false}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup too late and no delay', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onBackup={jest.fn()}
        onSocialBackup={jest.fn()}
        backupCompleted={false}
        socialBackupCompleted={false}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={0}
        backupTooLate={true}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup too late and delayed', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onBackup={jest.fn()}
        onSocialBackup={jest.fn()}
        backupCompleted={false}
        socialBackupCompleted={false}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={1}
        backupTooLate={true}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
