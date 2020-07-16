import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import ImportContactsScreen from 'src/onboarding/contacts/ImportContactsScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('ImportContactsScreen', () => {
  const store = createMockStore()

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <ImportContactsScreen {...getMockStackScreenProps(Screens.ImportContacts)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
