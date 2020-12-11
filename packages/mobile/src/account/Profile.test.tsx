import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { saveNameAndPicture } from 'src/account/actions'
import Profile from 'src/account/Profile'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('Profile', () => {
  const store = createMockStore({})
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <Profile {...getMockStackScreenProps(Screens.Profile, { save: false })} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  describe('when updating name', () => {
    const name = 'New Name'
    it('edits name', () => {
      const { getByDisplayValue, update } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile, { save: false })} />
        </Provider>
      )
      const input = getByDisplayValue((store.getState() as RootState).account.name!)
      fireEvent.changeText(input, name)
      expect(store.getActions().length).toEqual(0)

      update(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile, { save: true })} />
        </Provider>
      )
      expect(store.getActions()).toEqual(expect.arrayContaining([saveNameAndPicture(name, null)]))
    })
  })
})
