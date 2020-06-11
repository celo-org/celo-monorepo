import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { AVAILABLE_LANGUAGES } from 'src/config'
import Language from 'src/language/Language'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('Language', () => {
  it('renders correctly and sets the right language', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <Language {...getMockStackScreenProps(Screens.Language, {})} />
      </Provider>
    )

    AVAILABLE_LANGUAGES.forEach(({ name }) => {
      expect(getByText(name)).toBeDefined()
    })

    fireEvent.press(getByText('Español (América Latina)'))
    // Run timers, because Touchable adds some delay
    jest.runAllTimers()
    expect(mockNavigation.navigate).toHaveBeenCalledWith(Screens.JoinCelo)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "language": "es-419",
          "type": "APP/SET_LANGUAGE",
        },
      ]
    `)
  })
})
