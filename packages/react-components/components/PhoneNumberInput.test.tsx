import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'

describe('PhoneNumberInput', () => {
  describe('when defaultCountry is falsy', () => {
    it('renders an AutoComplete and a country can be selected', () => {
      const mockSetCountryCode = jest.fn()
      const { getByTestId, toJSON } = render(
        <PhoneNumberInput
          defaultCountry={null}
          setE164Number={jest.fn()}
          setIsValidNumber={jest.fn()}
          setCountryCode={mockSetCountryCode}
        />
      )

      expect(toJSON()).toMatchSnapshot()
      const autocomplete = getByTestId('CountryNameField')
      expect(autocomplete).toBeTruthy()
      fireEvent.changeText(autocomplete, 'Canada')
      expect(mockSetCountryCode).toHaveBeenCalledWith('+1')
    })
  })
})

describe('when defaultCountry is truthy', () => {
  it('does not render an AutoComplete', () => {
    const { queryByTestId, toJSON } = render(
      <PhoneNumberInput
        defaultCountry={'Canada'}
        setE164Number={jest.fn()}
        setIsValidNumber={jest.fn()}
        setCountryCode={jest.fn()}
      />
    )
    expect(toJSON()).toMatchSnapshot()
    const autocomplete = queryByTestId('CountryNameField')
    expect(autocomplete).toBeFalsy()
  })
})
