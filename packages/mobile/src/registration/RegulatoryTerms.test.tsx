import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { PincodeType } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import RegulatoryTerms, {
  RegulatoryTerms as RegulatoryTermsClass,
} from 'src/registration/RegulatoryTerms'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/navigator/NavigationService', () => {
  return { navigate: jest.fn() }
})

describe('RegulatoryTermsScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <RegulatoryTerms />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when accept button is pressed', () => {
    it('stores that info', async () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass
            pincodeType={PincodeType.Unset}
            {...getMockI18nProps()}
            acceptTerms={acceptTerms}
          />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(acceptTerms).toHaveBeenCalled()
    })
    it('navigates to PincodeEducation when pin has not been set', () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass
            pincodeType={PincodeType.Unset}
            {...getMockI18nProps()}
            acceptTerms={acceptTerms}
          />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(navigate).toHaveBeenCalledWith(Screens.PincodeEducation)
    })
    it('navigates to EnterInviteCode when pin has been set', () => {
      const store = createMockStore({})
      const acceptTerms = jest.fn()
      const wrapper = render(
        <Provider store={store}>
          <RegulatoryTermsClass
            pincodeType={PincodeType.CustomPin}
            {...getMockI18nProps()}
            acceptTerms={acceptTerms}
          />
        </Provider>
      )
      fireEvent.press(wrapper.getByTestId('AcceptTermsButton'))
      expect(navigate).toHaveBeenCalledWith(Screens.EnterInviteCode)
    })
  })
})
