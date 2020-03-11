import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import SignupForm from 'src/alliance/SignupForm'
describe('When Submitting', () => {
  describe('when not filled out', () => {
    it('shows errors', async () => {
      const { getByText } = render(<SignupForm />)

      fireEvent.click(getByText('form.btn'))

      expect(getByText('common:validationErrors.email')).toBeTruthy()
      expect(getByText('common:validationErrors.generic')).toBeTruthy()
    })
  })
})
