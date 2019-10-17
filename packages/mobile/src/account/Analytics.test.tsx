import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Analytics from 'src/account/Analytics'
import { createMockStore } from 'test/utils'

describe('Analytics', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Analytics />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
