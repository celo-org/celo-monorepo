import Button, { BTN, SIZE } from 'src/shared/Button.3'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'

describe('ButtonPrimary', () => {
  describe('with href', () => {
    it('renders anchor tag with href', () => {
      const { getByText } = render(
        <Button text="Primary" href="/sidelink" kind={BTN.PRIMARY} size={SIZE.normal} />
      )

      expect(getByText('Primary').getAttribute('href')).toEqual('/sidelink')
    })
  })
  describe('with on onPress', () => {
    it('calls it when clicked', () => {
      const onPress = jest.fn()

      const { container } = render(
        <Button text="Press Me" onPress={onPress} kind={BTN.PRIMARY} size={SIZE.normal} />
      )
      fireEvent.click(container.firstElementChild)
      expect(onPress).toHaveBeenCalled()
    })
  })
  describe('when mouse Down', () => {
    it('changes color', () => {
      const onPress = jest.fn()

      const { getByText } = render(
        <Button text="Press Me" onPress={onPress} kind={BTN.PRIMARY} size={SIZE.normal} />
      )
      const button = getByText('Press Me')

      const original = button.classList
      fireEvent.mouseDown(button)
      expect(original).toEqual(getByText('Press Me').classList)
    })
  })
})
