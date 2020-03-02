import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Contact from 'src/account/Contact'
import { createMockStore } from 'test/utils'

describe('Contact', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Contact />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
