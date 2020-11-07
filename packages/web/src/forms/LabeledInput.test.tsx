import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import { LabeledInput } from 'src/forms/LabeledInput'

describe(LabeledInput, () => {
  describe('when there is an error', () => {
    it('displays error message', () => {
      const { getByText } = render(
        <TestProvider>
          <LabeledInput
            allErrors={['machinereadable']}
            name={'machinereadable'}
            value={'no'}
            label="Human Label"
            onInput={jest.fn()}
          />
        </TestProvider>
      )

      expect(getByText('Oops I’m blank!')).toBeVisible()
    })
  })
  describe('when there is no error', () => {
    it('displays no message ', () => {
      const { queryByText } = render(
        <TestProvider>
          <LabeledInput
            allErrors={['otherError']}
            name={'machinereadable'}
            value={'no'}
            label="Human Label"
            onInput={jest.fn()}
          />
        </TestProvider>
      )

      expect(queryByText('Oops I’m blank!')).not.toBeVisible()
    })
  })
  describe('when typing', () => {
    it('calls the onInput function', () => {
      const mockFunc = jest.fn()

      const { queryByLabelText } = render(
        <TestProvider>
          <LabeledInput
            allErrors={[]}
            name={'machinereadable'}
            value={'begin'}
            label="Human Label"
            onInput={mockFunc}
          />
        </TestProvider>
      )

      const el = queryByLabelText('Human Label')

      fireEvent.change(el, { target: { value: 'a' } })

      expect(mockFunc).toBeCalled()
    })
  })
})
