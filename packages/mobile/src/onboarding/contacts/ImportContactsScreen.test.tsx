import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ImportContactsScreen from 'src/onboarding/contacts/ImportContactsScreen'
import { createMockStore } from 'test/utils'

describe('ImportContactsScreen', () => {
  const store = createMockStore()

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ImportContactsScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
