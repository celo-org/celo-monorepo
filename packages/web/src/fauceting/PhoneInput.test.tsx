import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { onPress } from 'src/_page-tests/test-utils'
import PhoneInput from 'src/fauceting/PhoneInput'

describe('PhoneInput', () => {
  describe('on initial', () => {
    it('renders an input for country', () => {
      const { getByPlaceholderText } = render(<PhoneInput onChangeNumber={jest.fn()} />)
      expect(getByPlaceholderText('Country or Territory')).toBeTruthy()
    })
    it('renders an input for phone Number', () => {
      const { getByPlaceholderText } = render(<PhoneInput onChangeNumber={jest.fn()} />)
      expect(getByPlaceholderText('Phone Number')).toBeTruthy()
    })
  })
  describe('when user types in country box and then fills in phone number', () => {
    it('renders suggestions, sets country code when pressed, and formats phone number', async () => {
      const { getByPlaceholderText, getAllByText, getByText } = render(
        <PhoneInput onChangeNumber={jest.fn()} />
      )
      const countryInput = getByPlaceholderText('Country or Territory')

      fireEvent.change(countryInput, { target: { value: 'United' } })
      const suggestions = getAllByText(/United/)
      expect(suggestions.length).toBeGreaterThanOrEqual(1)

      onPress(getByText('United Kingdom'))
      expect(getByText('+44')).toBeTruthy()

      const phoneInput = getByPlaceholderText('Phone Number')

      fireEvent.change(phoneInput, { target: { value: '7911123456' } })
      expect(phoneInput.getAttribute('value')).toEqual('07911 123456')
    })
  })
})
