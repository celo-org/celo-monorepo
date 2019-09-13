import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupComplete from 'src/backup/BackupComplete'
import { createMockStore } from 'test/utils'

describe('BackupComplete', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <BackupComplete />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
