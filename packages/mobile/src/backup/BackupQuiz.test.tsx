import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupQuiz from 'src/backup/BackupQuiz'
import { createMockStore } from 'test/utils'

describe('BackupQuiz', () => {
  it('renders correctly', () => {
    // const store = createMockStore(storeData)
    const store = createMockStore({
      account: {
        backupCompleted: false,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <BackupQuiz />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
