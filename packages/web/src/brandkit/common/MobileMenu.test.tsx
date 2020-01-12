import { fireEvent, getByTitle, render } from '@testing-library/react'
import * as React from 'react'
import MobileMenu from './MobileMenu'

describe(MobileMenu, () => {
  xdescribe('when pressed', () => {
    it('shifts from open to closed', () => {
      const { getByTestId } = render(
        <MobileMenu
          pages={[
            {
              title: 'Example',
              href: '/example',
              sections: [],
            },
          ]}
          pathname={'/experience/brand'}
          routeHash={'#super'}
        />
      )

      const svgUp = getByTitle(getByTestId('toggle'), 'triangle').parentElement
      expect(svgUp.getAttribute('transform')).toEqual('rotate(0)')

      fireEvent.click(getByTestId('toggle'))

      const svgDown = getByTitle(getByTestId('toggle'), 'triangle').parentElement

      expect(svgDown.getAttribute('transform')).toEqual('rotate(180)')
    })
  })
})
