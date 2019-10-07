import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import GoldEducation from 'src/account/GoldEducation'
import { createMockStore } from 'test/utils'

describe('GoldEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <GoldEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
