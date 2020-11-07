import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import SignupForm from 'src/alliance/SignupForm'

import { TestProvider } from 'src/_page-tests/test-utils'

describe('When Submitting', () => {
  describe('when not filled out', () => {
    it('shows errors', async () => {
      const { getByText } = render(
        <TestProvider>
          <SignupForm />
        </TestProvider>
      )

      fireEvent.click(getByText('Apply'))
      expect(getByText('Application Submitted')).not.toBeVisible()
      expect(getByText('Please enter a valid email')).toBeVisible()
      expect(getByText('Oops I’m blank!')).toBeVisible()
    })
    it('does not show any unknown Errors', () => {
      const { queryByText } = render(
        <TestProvider>
          <SignupForm />
        </TestProvider>
      )
      expect(queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })
  describe('when filled out', () => {
    it('displays success message', async () => {
      const { getByLabelText, getByText } = render(
        <TestProvider>
          <SignupForm />
        </TestProvider>
      )

      fireEvent.change(getByLabelText('Email'), { target: { value: 'hello@example.com' } })
      fireEvent.change(getByLabelText('Name'), { target: { value: 'Human' } })
      fireEvent.click(getByText('Apply'))
      await waitFor(() => true)
      expect(getByText('Application Submitted')).toBeVisible()
      expect(getByText('Please enter a valid email')).not.toBeVisible()
      expect(getByText('Oops I’m blank!')).not.toBeVisible()
    })
  })
})
