import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Language from 'src/language/Language'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const tree = renderer.create(
    <Provider store={createMockStore()}>
      <MockedNavigator component={Language} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
