import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import EmailForm from 'src/forms/EmailForm'

describe('EmailForm', () => {
  describe('when first shown to visitor', () => {
    it('sets the submit button text', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(
        <TestProvider>
          <EmailForm submitText={submitBTNText} />
        </TestProvider>
      )

      expect(getByText(submitBTNText)).toBeVisible()

      expect(queryByText('Please enter a valid email')).not.toBeVisible()
    })

    it('does not show success message', () => {
      const { queryByText } = render(
        <TestProvider>
          <EmailForm submitText={'test'} />
        </TestProvider>
      )

      expect(queryByText('Submitted')).not.toBeVisible()
    })
  })

  describe('when blank form is submitted', () => {
    it('shows error message', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(
        <TestProvider>
          <EmailForm submitText={submitBTNText} />{' '}
        </TestProvider>
      )

      fireEvent.click(getByText(submitBTNText))

      expect(queryByText('Please enter a valid email')).toBeVisible()
    })
  })

  describe('when filled out form is submitted', () => {
    it('does not show error message and shows success message', async () => {
      const submitBTNText = 'Pres here'
      const { getByText, getByPlaceholderText, findByText } = render(
        <TestProvider>
          <EmailForm submitText={submitBTNText} />
        </TestProvider>
      )

      fireEvent.change(getByPlaceholderText('Email*'), {
        target: { value: 'celo@example.com' },
      })

      fireEvent.click(getByText(submitBTNText))
      const errorMessage = await findByText('Please enter a valid email')
      expect(errorMessage).not.toBeVisible()
      const successMessage = await findByText('Submitted')
      expect(successMessage).toBeVisible()
    })
  })
})
