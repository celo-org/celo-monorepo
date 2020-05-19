import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Language from 'src/language/Language'
import { createMockStore } from 'test/utils'

jest.mock('@react-navigation/native', () => {
  const { mockNavigation } = require('test/values')
  const { Screens } = require('src/navigator/Screens')
  return {
    useNavigation: () => mockNavigation,
    useRoute: () => ({
      name: Screens.Language,
      key: '1',
      params: {},
    }),
  }
})

it('renders correctly', () => {
  const tree = renderer.create(
    <Provider store={createMockStore()}>
      <Language />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
