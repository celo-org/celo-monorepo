import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Licenses from 'src/account/Licenses'
import { createMockStore } from 'test/utils'

describe('Licenses', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Licenses />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
