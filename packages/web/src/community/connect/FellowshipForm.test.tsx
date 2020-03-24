import { fireEvent, render, waitForElement } from '@testing-library/react'
import * as React from 'react'
import FellowshipForm from 'src/community/connect/FellowshipForm'

describe('FellowshipForm', () => {
  describe('when visitor tries submiting without filling out form', () => {
    it('shows validation errors', async () => {
      const { getByText, queryAllByText } = render(<FellowshipForm />)

      const emailErrorEl = getByText('common:validationErrors.email')

      const submitButton = getByText('submit')

      fireEvent.click(submitButton)

      expect(emailErrorEl).toBeVisible()

      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).toBeVisible()
      )
    })
  })

  describe('on first render', () => {
    it('is all clear', async () => {
      const { getByText, queryAllByText } = render(<FellowshipForm />)

      const emailErrorEl = getByText('common:validationErrors.email')

      expect(emailErrorEl).not.toBeVisible()

      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
    })
  })

  describe('when visitor presses submit after filling out the form', () => {
    it('does not show errors', async () => {
      const { getByText, queryAllByText, getByPlaceholderText } = render(<FellowshipForm />)

      fireEvent.change(getByPlaceholderText('form.name'), { target: { value: 'xu' } })

      fireEvent.change(getByPlaceholderText('form.ideas'), { target: { value: 'what if' } })

      fireEvent.change(getByPlaceholderText('form.email'), {
        target: { value: 'connect@exampel.com' },
      })

      fireEvent.change(getByPlaceholderText('form.bio'), { target: { value: 'logic' } })

      fireEvent.change(getByPlaceholderText('form.resume'), { target: { value: 'Resume.pdf' } })

      fireEvent.change(getByPlaceholderText('form.deliverables'), { target: { value: 'tests' } })

      const submitButton = getByText('submit')
      fireEvent.click(submitButton)

      // expectations
      const emailErrorEl = getByText('common:validationErrors.email')
      expect(emailErrorEl).not.toBeVisible()
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
      await waitForElement(() => getByText('form.fellowshipSubmitted'))

      expect(getByText('form.fellowshipSubmitted')).toBeTruthy()
    })
  })
})
