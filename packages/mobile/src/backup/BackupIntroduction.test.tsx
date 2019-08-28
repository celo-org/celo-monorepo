import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'

describe('BackupIntroduction', () => {
  it('renders correctly when backup is not too late', () => {
    const tree = renderer.create(
      <BackupIntroduction
        onPress={jest.fn()}
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
        onPress={jest.fn()}
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
        onPress={jest.fn()}
        onCancel={jest.fn()}
        onDelay={jest.fn()}
        backupDelayedTime={1}
        backupTooLate={true}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
