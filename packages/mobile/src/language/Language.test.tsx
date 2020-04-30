import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Language from 'src/language/Language'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const navigation: any = { getParam: jest.fn() }
  const tree = renderer.create(
    <Provider store={createMockStore()}>
      <Language setLanguage={jest.fn()} navigation={navigation} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
