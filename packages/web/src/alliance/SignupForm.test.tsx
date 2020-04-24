import { fireEvent, render, waitForDomChange } from '@testing-library/react'
import * as React from 'react'
import SignupForm from 'src/alliance/SignupForm'
describe('When Submitting', () => {
  describe('when not filled out', () => {
    it('shows errors', async () => {
      const { getByText } = render(<SignupForm />)

      fireEvent.click(getByText('form.btn'))
      expect(getByText('common:applicationSubmitted')).not.toBeVisible()
      expect(getByText('common:validationErrors.email')).toBeVisible()
      expect(getByText('common:validationErrors.generic')).toBeVisible()
    })
    it('does not show any unknown Errors', () => {
      const { queryByText } = render(<SignupForm />)
      expect(queryByText('common:validationErrors.unknownError')).not.toBeInTheDocument()
    })
  })
  describe('when filled out', () => {
    it('displays success message', async () => {
      const { getByLabelText, getByText } = render(<SignupForm />)

      fireEvent.change(getByLabelText('form.email'), { target: { value: 'hello@example.com' } })
      fireEvent.change(getByLabelText('form.name'), { target: { value: 'Human' } })
      fireEvent.click(getByText('form.btn'))
      await waitForDomChange()
      expect(getByText('common:applicationSubmitted')).toBeVisible()
      expect(getByText('common:validationErrors.email')).not.toBeVisible()
      expect(getByText('common:validationErrors.generic')).not.toBeVisible()
    })
  })
})
