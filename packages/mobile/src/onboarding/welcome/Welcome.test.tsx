import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Welcome from 'src/onboarding/welcome/Welcome'
import { createMockStore } from 'test/utils'

describe('Welcome', () => {
  it('renders and behaves correctly', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <Welcome /*{...getMockStackScreenProps(Screens.)}*/ />
      </Provider>
    )

    fireEvent.press(getByTestId('CreateAccountButton'))
    jest.runAllTimers()
    expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "type": "ACCOUNT/CHOOSE_CREATE",
        },
      ]
    `)

    store.clearActions()

    fireEvent.press(getByTestId('RestoreAccountButton'))
    jest.runAllTimers()
    expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "type": "ACCOUNT/CHOOSE_RESTORE",
        },
      ]
    `)
  })
})
