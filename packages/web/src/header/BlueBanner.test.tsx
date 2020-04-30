import { render } from '@testing-library/react'
import * as React from 'react'
import { BlueBanner } from 'src/header/BlueBanner'

describe('BlueBanner', () => {
  const getHeight = jest.fn()

  describe('when isVisible true', () => {
    it('renders with height', () => {
      const { getByRole, getByTestId } = render(
        <BlueBanner link="/testing" isVisible={true} getRealHeight={getHeight}>
          Say Hi
        </BlueBanner>
      )
      expect(getByRole('link').getAttribute('href')).toEqual('/testing')
      expect(getByTestId('banner').style.minHeight).toEqual('50px')
    })
  })
  describe('when isVisible is false', () => {
    it('is not visible due to height', () => {
      const { getByTestId } = render(
        <BlueBanner link="/testing" isVisible={false} getRealHeight={getHeight}>
          Say Hi
        </BlueBanner>
      )
      expect(getByTestId('banner').style.height).toEqual('0px')
      expect(getByTestId('banner').style.minHeight).toEqual('')
    })
  })
})
