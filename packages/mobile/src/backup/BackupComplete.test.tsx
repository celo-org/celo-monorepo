import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupComplete from 'src/backup/BackupComplete'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupComplete', () => {
  it('renders correctly when social backup is not complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true, socialBackupCompleted: false },
        })}
      >
        <BackupComplete {...getMockStackScreenProps(Screens.BackupComplete)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when social backup is complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({ account: { backupCompleted: true, socialBackupCompleted: true } })}
      >
        <BackupComplete {...getMockStackScreenProps(Screens.BackupComplete)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
