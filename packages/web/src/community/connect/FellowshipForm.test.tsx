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
    it('does not show any unknown Errors', () => {
      const { queryByText } = render(<FellowshipForm />)
      expect(queryByText('common:validationErrors.unknownError')).not.toBeInTheDocument()
    })
  })

  describe('when visitor presses submit after filling out the form', () => {
    it('does not show errors', async () => {
      const { getByText, queryAllByText, getByLabelText } = render(<FellowshipForm />)

      fireEvent.change(getByLabelText('form.name'), { target: { value: 'xu' } })

      fireEvent.change(getByLabelText('form.ideas'), { target: { value: 'what if' } })

      fireEvent.change(getByLabelText('form.email'), {
        target: { value: 'connect@exampel.com' },
      })

      fireEvent.change(getByLabelText('form.bio'), { target: { value: 'logic' } })

      fireEvent.change(getByLabelText('form.resume'), { target: { value: 'Resume.pdf' } })

      fireEvent.change(getByLabelText('form.deliverables'), { target: { value: 'tests' } })

      const submitButton = getByText('submit')
      fireEvent.click(submitButton)

      // expectations
      const emailErrorEl = getByText('common:validationErrors.email')
      expect(emailErrorEl).not.toBeVisible()
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
      await waitForElement(() => getByText('common:applicationSubmitted'))

      expect(getByText('common:applicationSubmitted')).toBeVisible()
    })
  })
})
