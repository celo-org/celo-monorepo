import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupQuiz from 'src/backup/BackupQuiz'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

describe('BackupQuiz', () => {
  const store = createMockStore()
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({ mnemonic: mockMnemonic })
    const tree = renderer.create(
      <Provider store={store}>
        <BackupQuiz navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  //TODO more
})
