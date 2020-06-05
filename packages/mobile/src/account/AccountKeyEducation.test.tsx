import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import { createMockStore } from 'test/utils'

describe('AccountKeyEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <AccountKeyEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
