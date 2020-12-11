import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { saveNameAndPicture } from 'src/account/actions'
import Profile from 'src/account/Profile'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('Profile', () => {
  const store = createMockStore({})
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <Profile {...getMockStackScreenProps(Screens.Profile)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  describe('when updating name', () => {
    const name = 'New Name'
    it('edits name', () => {
      let headerSaveButton: React.ReactNode
      ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
        headerSaveButton = options.headerRight()
      })

      const { getByDisplayValue } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile)} />
        </Provider>
      )

      const input = getByDisplayValue((store.getState() as RootState).account.name!)
      fireEvent.changeText(input, name)
      expect(store.getActions().length).toEqual(0)

      const { getByTestId } = render(<Provider store={store}>{headerSaveButton}</Provider>)

      fireEvent.press(getByTestId('SaveButton'))
      expect(store.getActions()).toEqual(expect.arrayContaining([saveNameAndPicture(name, null)]))
    })
  })
})
