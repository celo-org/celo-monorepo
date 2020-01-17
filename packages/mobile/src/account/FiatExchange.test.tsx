import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import FiatExchange from 'src/account/GoldEducation'
import { createMockStore } from 'test/utils'

describe('GoldEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <FiatExchange />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
