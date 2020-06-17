import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupIntroduction', () => {
  it('renders correctly when backup not complete', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupIntroduction {...getMockStackScreenProps(Screens.BackupIntroduction)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when backup completed', () => {
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupIntroduction {...getMockStackScreenProps(Screens.BackupIntroduction)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
