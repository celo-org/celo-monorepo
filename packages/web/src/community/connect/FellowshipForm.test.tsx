import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { TestProvider } from 'src/_page-tests/test-utils'
import FellowshipForm from 'src/community/connect/FellowshipForm'

describe('FellowshipForm', () => {
  describe('when visitor tries submiting without filling out form', () => {
    it('shows validation errors', async () => {
      const { getByText, queryAllByText } = render(
        <TestProvider>
          <FellowshipForm />
        </TestProvider>
      )

      const emailErrorEl = getByText('Please enter a valid email')

      const submitButton = getByText('Submit')

      fireEvent.click(submitButton)

      expect(emailErrorEl).toBeVisible()

      queryAllByText('Oops I’m blank!').forEach((element) => expect(element).toBeVisible())
    })
  })

  describe('on first render', () => {
    it('is all clear', async () => {
      const { getByText, queryAllByText } = render(
        <TestProvider>
          <FellowshipForm />
        </TestProvider>
      )

      const emailErrorEl = getByText('Please enter a valid email')

      expect(emailErrorEl).not.toBeVisible()

      queryAllByText('Oops I’m blank!').forEach((element) => expect(element).not.toBeVisible())
    })
    it('does not show any unknown Errors', () => {
      const { queryByText } = render(
        <TestProvider>
          <FellowshipForm />
        </TestProvider>
      )
      expect(queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('when visitor presses submit after filling out the form', () => {
    it('does not show errors', async () => {
      const { getByText, queryAllByText, getByLabelText } = render(
        <TestProvider>
          <FellowshipForm />
        </TestProvider>
      )

      fireEvent.change(getByLabelText('Full name'), { target: { value: 'xu' } })

      fireEvent.change(getByLabelText('What do you want to create?'), {
        target: { value: 'what if' },
      })

      fireEvent.change(getByLabelText('Email'), {
        target: { value: 'connect@exampel.com' },
      })

      fireEvent.change(getByLabelText('Tell us about yourself'), { target: { value: 'logic' } })

      fireEvent.change(getByLabelText('Link to LinkedIn or other personal website'), {
        target: { value: 'Resume.pdf' },
      })

      fireEvent.change(getByLabelText('What are your expected deliverables?'), {
        target: { value: 'tests' },
      })
      const submitButton = getByText('Submit')
      fireEvent.click(submitButton)
      // expectations
      await waitFor(() => getByText('Application Submitted'))

      const emailErrorEl = getByText('Please enter a valid email')
      expect(emailErrorEl).not.toBeVisible()
      queryAllByText('Oops I’m blank!').forEach((element) => expect(element).not.toBeVisible())

      expect(getByText('Application Submitted')).toBeVisible()
    })
  })
})
