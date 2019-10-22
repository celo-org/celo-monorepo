import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupComplete from 'src/backup/BackupComplete'
import { createMockStore } from 'test/utils'

describe('BackupComplete', () => {
  it('renders correctly when social backup is not complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true, socialBackupCompleted: false },
        })}
      >
        <BackupComplete />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when social backup is complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({ account: { backupCompleted: true, socialBackupCompleted: true } })}
      >
        <BackupComplete />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
