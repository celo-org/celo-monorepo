import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { LabeledInput } from 'src/forms/LabeledInput'

describe(LabeledInput, () => {
  describe('when there is an error', () => {
    it('displays error message', () => {
      const { getByText } = render(
        <LabeledInput
          allErrors={['machinereadable']}
          name={'machinereadable'}
          value={'no'}
          label="Human Label"
          onInput={jest.fn()}
        />
      )

      expect(getByText('common:validationErrors.generic')).toBeVisible()
    })
  })
  describe('when there is no error', () => {
    it('displays no message ', () => {
      const { queryByText } = render(
        <LabeledInput
          allErrors={['otherError']}
          name={'machinereadable'}
          value={'no'}
          label="Human Label"
          onInput={jest.fn()}
        />
      )

      expect(queryByText('common:validationErrors.generic')).not.toBeVisible()
    })
  })
  describe('when typing', () => {
    it('calls the onInput function', () => {
      const mockFunc = jest.fn()

      const { queryByLabelText } = render(
        <LabeledInput
          allErrors={[]}
          name={'machinereadable'}
          value={'begin'}
          label="Human Label"
          onInput={mockFunc}
        />
      )

      const el = queryByLabelText('Human Label')

      fireEvent.change(el, { target: { value: 'a' } })

      expect(mockFunc).toBeCalled()
    })
  })
})
