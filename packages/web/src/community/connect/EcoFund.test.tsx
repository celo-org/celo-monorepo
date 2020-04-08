import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { ApplicationFields, RecommendationFields } from 'src/../fullstack/EcoFundFields'
import EcoFund from 'src/community/EcoFund'

describe('EcoFund', () => {
  describe('on first render', () => {
    it('is all clear', async () => {
      const { queryAllByText } = render(<EcoFund />)

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
      const { getByText, queryAllByText } = render(<EcoFund />)

      const submitButton = getByText('apply')

      fireEvent.click(submitButton)

      queryAllByText('common:validationErrors:email').forEach((element) =>
        expect(element).toBeVisible()
      )

      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).toBeVisible()
      )
    })
  })

  describe('when visitor presses submit after filling out the form', () => {
    it('does not show errors', async () => {
      const { getByText, queryAllByText, getByLabelText } = render(<EcoFund />)

      fireEvent.change(getByLabelText(ApplicationFields.about), { target: { value: 'UBI' } })

      fireEvent.change(getByLabelText(ApplicationFields.product), { target: { value: 'UBI' } })

      fireEvent.change(getByLabelText(ApplicationFields.founderEmail), {
        target: { value: 'connect@example.com' },
      })

      fireEvent.change(getByLabelText(ApplicationFields.org), { target: { value: 'example.org' } })

      fireEvent.change(getByLabelText(ApplicationFields.video), { target: { value: 'video.mov' } })

      const submitButton = getByText('apply')
      fireEvent.click(submitButton)

      // expectations
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
      queryAllByText('common:validationErrors:generic').forEach((element) =>
        expect(element).not.toBeVisible()
      )
    })
  })
  describe('when the "Recomendations Button is Pressed', () => {
    function renderAndPressRecomendation() {
      const all = render(<EcoFund />)

      fireEvent.click(all.getByText('ecoFund.recommendProject'))

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
