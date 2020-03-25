import { fireEvent, render, waitForDomChange } from '@testing-library/react'
import * as React from 'react'
import { Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'

describe('EmailForm', () => {
  describe('when first shown to visitor', () => {
    it('sets the submit button text', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(
        <EmailForm submitText={submitBTNText} whenComplete={<View />} />
      )

      expect(getByText(submitBTNText)).toBeVisible()

      expect(queryByText('common:validationErrors.email')).not.toBeInTheDocument()
    })

    it('does not show whenComplete', () => {
      const { queryByText } = render(
        <EmailForm submitText={'test'} whenComplete={<Text>when complete</Text>} />
      )

      expect(queryByText('when complete')).not.toBeInTheDocument()
    })
  })

  describe('when blank form is submitted', () => {
    it('shows error message', () => {
      const submitBTNText = 'Pres here'
      const { getByText, queryByText } = render(
        <EmailForm submitText={submitBTNText} whenComplete={<View />} />
      )

      fireEvent.click(getByText(submitBTNText))

      expect(queryByText('common:validationErrors.email')).toBeVisible()
    })
  })

  describe('when filled out form is submitted', () => {
    it('shows does not show error message and shows the whenComplete element', async () => {
      const submitBTNText = 'Pres here'
      const testID = 'Prosper'
      const { getByText, queryByText, getByPlaceholderText, getByTestId } = render(
        <EmailForm submitText={submitBTNText} whenComplete={<View testID={testID} />} />
      )

      fireEvent.change(getByPlaceholderText('common:email*'), {
        target: { value: 'celo@example.com' },
      })

      fireEvent.click(getByText(submitBTNText))
      await waitForDomChange()
      expect(queryByText('common:validationErrors.email')).not.toBeInTheDocument()
      expect(getByTestId(testID)).toBeInTheDocument()
    })
  })
})
