import { fireEvent, render, waitForDomChange } from '@testing-library/react'
import * as React from 'react'
import EmailForm from 'src/forms/EmailForm'

describe('EmailForm', () => {
  describe('when first shown to visitor', () => {
    it('sets the submit button text', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(<EmailForm submitText={submitBTNText} />)

      expect(getByText(submitBTNText)).toBeVisible()

      expect(queryByText('common:validationErrors.email')).not.toBeVisible()
    })

    it('does not show success message', () => {
      const { queryByText } = render(<EmailForm submitText={'test'} />)

      expect(queryByText('common:shortSuccess')).not.toBeVisible()
    })
  })

  describe('when blank form is submitted', () => {
    it('shows error message', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(<EmailForm submitText={submitBTNText} />)

      fireEvent.click(getByText(submitBTNText))

      expect(queryByText('common:validationErrors.email')).toBeVisible()
    })
  })

  describe('when filled out form is submitted', () => {
    it('shows does not show error message and shows success message', async () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText, getByPlaceholderText } = render(
        <EmailForm submitText={submitBTNText} />
      )

      fireEvent.change(getByPlaceholderText('common:email*'), {
        target: { value: 'celo@example.com' },
      })

      fireEvent.click(getByText(submitBTNText))
      await waitForDomChange()
      expect(queryByText('common:validationErrors.email')).not.toBeVisible()

      expect(queryByText('common:shortSuccess')).toBeVisible()
    })
  })
})
