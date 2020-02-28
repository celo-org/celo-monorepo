import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import { createMockStore } from 'test/utils'

const NOW = new Date().getTime()

describe('BackupIntroduction', () => {
  it('renders correctly when neither backup nor social backup are complete', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup completed and social backup not completed', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true, socialBackupCompleted: false },
        })}
      >
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup completed and social backup completed', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true, socialBackupCompleted: true },
        })}
      >
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup too late and no delay', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { accountCreationTime: NOW - 1000 },
        })}
      >
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup too late and delayed', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { accountCreationTime: NOW - 1000, backupDelayedTime: NOW },
        })}
      >
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
