import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { PincodeType } from 'src/account/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import JoinCelo, { JoinCelo as JoinCeloClass } from 'src/onboarding/registration/JoinCelo'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.JoinCelo)

describe('JoinCeloScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <JoinCelo {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders with an error', () => {
    const store = createMockStore({ alert: { underlyingError: ErrorMessages.INVALID_INVITATION } })
    const tree = renderer.create(
      <Provider store={store}>
        <JoinCelo {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('show missing full name warning', () => {
    const showErrorMock = jest.fn()
    const store = createMockStore()
    const wrapper = render(
      <Provider store={store}>
        <JoinCeloClass
          acceptedTerms={false}
          showError={showErrorMock}
          hideAlert={jest.fn()}
          setPromptForno={jest.fn()}
          setPhoneNumber={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={'+1'}
          pincodeType={PincodeType.Unset}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    fireEvent.changeText(wrapper.getByTestId('PhoneNumberField'), '4155556666')
    fireEvent.press(wrapper.getByTestId('JoinCeloContinueButton'))
    expect(showErrorMock.mock.calls[0][0]).toBe(ErrorMessages.MISSING_FULL_NAME)
  })

  it('is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <JoinCeloClass
          acceptedTerms={false}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          setPromptForno={jest.fn()}
          setPhoneNumber={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={''}
          pincodeType={PincodeType.Unset}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('continue button disabled when invalid number', () => {
    const error = jest.fn()

    const wrapper = render(
      <Provider store={createMockStore()}>
        <JoinCeloClass
          acceptedTerms={false}
          showError={error}
          hideAlert={jest.fn()}
          setPhoneNumber={jest.fn()}
          setPromptForno={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={''}
          pincodeType={PincodeType.Unset}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    fireEvent.changeText(wrapper.getByTestId('PhoneNumberField'), '12345')
    expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })
})
