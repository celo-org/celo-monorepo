import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Support from 'src/account/Support'
import { createMockStore } from 'test/utils'

describe('Support', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Support />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
