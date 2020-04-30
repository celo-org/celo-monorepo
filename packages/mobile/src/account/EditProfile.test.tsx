import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import EditProfile from 'src/account/EditProfile'
import { createMockStore } from 'test/utils'

it('renders the EditProfile Component', () => {
  const store = createMockStore()
  const tree = renderer.create(
    <Provider store={store}>
      <EditProfile />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
