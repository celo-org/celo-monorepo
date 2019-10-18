import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupSocial from 'src/backup/BackupSocial'
import { createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

jest.mock('react-native-secure-key-store', () => {
  return {
    get: () => {
      return mockMnemonic
    },
  }
})

describe('BackupSocialIntro', () => {
  it('renders correctly when social backup is not complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true, socialBackupCompleted: false },
        })}
      >
        <BackupSocial />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when social backup is complete', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({ account: { backupCompleted: true, socialBackupCompleted: true } })}
      >
        <BackupSocial />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
