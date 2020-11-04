import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import NameAndNumber, {
  NameAndNumber as NameAndNumberClass,
} from 'src/onboarding/registration/NameAndNumber'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.NameAndNumber)

describe('NameAndNumberScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <NameAndNumber {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders with an error', () => {
    const store = createMockStore({ alert: { underlyingError: ErrorMessages.INVALID_INVITATION } })
    const tree = renderer.create(
      <Provider store={store}>
        <NameAndNumber {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('show missing full name warning', () => {
    const showErrorMock = jest.fn()
    const store = createMockStore()
    const wrapper = render(
      <Provider store={store}>
        <NameAndNumberClass
          showError={showErrorMock}
          hideAlert={jest.fn()}
          setPromptForno={jest.fn()}
          setPhoneNumber={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={'+1'}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    fireEvent.changeText(wrapper.getByTestId('PhoneNumberField'), '4155556666')
    fireEvent.press(wrapper.getByTestId('NameAndNumberContinueButton'))
    expect(showErrorMock.mock.calls[0][0]).toBe(ErrorMessages.MISSING_FULL_NAME)
  })

  it('shows banned country warning', () => {
    const showErrorMock = jest.fn()
    const store = createMockStore()
    const wrapper = render(
      <Provider store={store}>
        <NameAndNumberClass
          showError={showErrorMock}
          hideAlert={jest.fn()}
          setPromptForno={jest.fn()}
          setPhoneNumber={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={'02123123'}
          cachedCountryCallingCode={'+53'}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    fireEvent.press(wrapper.getByTestId('NameAndNumberContinueButton'))
    expect(showErrorMock.mock.calls[0][0]).toBe(ErrorMessages.COUNTRY_NOT_AVAILABLE)
  })

  it('is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <NameAndNumberClass
          showError={jest.fn()}
          hideAlert={jest.fn()}
          setPromptForno={jest.fn()}
          setPhoneNumber={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={''}
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
        <NameAndNumberClass
          showError={error}
          hideAlert={jest.fn()}
          setPhoneNumber={jest.fn()}
          setPromptForno={jest.fn()}
          setName={jest.fn()}
          cachedName={''}
          cachedNumber={''}
          cachedCountryCallingCode={''}
          {...getMockI18nProps()}
          {...mockScreenProps}
        />
      </Provider>
    )
    fireEvent.changeText(wrapper.getByTestId('PhoneNumberField'), '12345')
    expect(wrapper.queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })
})
