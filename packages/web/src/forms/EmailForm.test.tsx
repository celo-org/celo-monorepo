import { render } from '@testing-library/react'
import * as React from 'react'
import { Text, View } from 'react-native'
import EmailForm from 'src/forms/EmailForm'

describe(EmailForm, () => {
  describe('when first shown to visitor', () => {
    xit('sets the submit button text', () => {
      const submitBTNText = 'Pres here'
      const { getByText } = render(<EmailForm submitText={submitBTNText} whenComplete={<View />} />)

      expect(getByText(submitBTNText)).toEqual('test')
    })
    it('does not show whenComplete', () => {
      const { queryByText } = render(
        <EmailForm submitText={'test'} whenComplete={<Text>when complete</Text>} />
      )

      expect(queryByText('when complete')).toBeFalsy()
    })
  })
})
