import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import { createMockStore } from 'test/utils'

describe('BackupIntroduction', () => {
  it('renders correctly when backup not complete', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupIntroduction />
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
        <BackupIntroduction />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
