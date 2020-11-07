import { fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ApplicationFields, RecommendationFields } from 'src/../fullstack/EcoFundFields'
import { TestProvider } from 'src/_page-tests/test-utils'
import EcoFund from 'src/community/EcoFund'

describe('EcoFund', () => {
  describe('on first render', () => {
    it('is all clear', async () => {
      const { queryAllByText } = render(
        <TestProvider>
          <EcoFund />
        </TestProvider>
      )

      queryAllByText('common:validationErrors:email').forEach((element) =>
        expect(element).not.toBeVisible()
      )

      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
    })
  })

  describe('when visitor tries submiting without filling out form', () => {
    it('shows validation errors', async () => {
      const { getByText, queryAllByText, queryByText } = render(
        <TestProvider>
          <EcoFund />
        </TestProvider>
      )

      const submitButton = getByText('Apply')

      fireEvent.click(submitButton)

      queryAllByText('common:validationErrors:email').forEach((element) =>
        expect(element).toBeVisible()
      )

      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).toBeVisible()
      )
      expect(queryByText('Application Submitted')).not.toBeVisible()
    })
  })

  describe('when visitor presses submit after filling out the form', () => {
    function submitSuccess() {
      const options = render(
        <TestProvider>
          <EcoFund />
        </TestProvider>
      )
      const { getByText, getByLabelText } = options

      fireEvent.change(getByLabelText(ApplicationFields.about), { target: { value: 'UBI' } })

      fireEvent.change(getByLabelText(ApplicationFields.product), { target: { value: 'UBI' } })

      fireEvent.change(getByLabelText(ApplicationFields.founderEmail), {
        target: { value: 'connect@example.com' },
      })

      fireEvent.change(getByLabelText(ApplicationFields.org), { target: { value: 'Celo' } })
      fireEvent.change(getByLabelText(ApplicationFields.url), { target: { value: 'example.com' } })

      fireEvent.change(getByLabelText(ApplicationFields.video), { target: { value: 'video.mov' } })

      const submitButton = getByText('Apply')
      fireEvent.click(submitButton)
      expect(submitButton).toBeVisible()
      return options
    }
    it('does not show errors', async () => {
      const { queryAllByText } = submitSuccess()
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
    })
    it('Shows a Success Message', async () => {
      const { queryByText } = submitSuccess()
      await waitFor(() => true)
      expect(queryByText('Application Submitted')).toBeVisible()
    })
  })
  describe('when the Recomendations Button is Pressed', () => {
    function renderAndPressRecomendation() {
      const all = render(
        <TestProvider>
          <EcoFund />
        </TestProvider>
      )

      fireEvent.click(all.getByText('Recommend a Project'))

      return all
    }

    it('hides the Application Form', () => {
      const { getByLabelText } = renderAndPressRecomendation()

      expect(getByLabelText(ApplicationFields.about)).not.toBeVisible()

      expect(getByLabelText(ApplicationFields.product)).not.toBeVisible()

      expect(getByLabelText(ApplicationFields.founderEmail)).not.toBeVisible()

      expect(getByLabelText(ApplicationFields.org)).not.toBeVisible()

      expect(getByLabelText(ApplicationFields.video)).not.toBeVisible()
    })

    it('shows the Recommendation Form', () => {
      const { getByLabelText } = renderAndPressRecomendation()

      expect(getByLabelText(RecommendationFields.why)).toBeVisible()

      expect(getByLabelText(RecommendationFields.email)).toBeVisible()

      expect(getByLabelText(RecommendationFields.founderEmail)).toBeVisible()

      expect(getByLabelText(RecommendationFields.org)).toBeVisible()
    })
  })
})
