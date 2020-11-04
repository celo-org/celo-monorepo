import { fireEvent, getByTitle, render } from '@testing-library/react'

import * as React from 'react'
import MobileMenu from 'src/experience/common/MobileKitMenu'

describe('Brandkit MobileMenu', () => {
  describe('when pressed', () => {
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

      // to get onPress to fire: see https://github.com/necolas/react-native-web/issues/1422
      fireEvent.click(getByTestId('toggle'))

      const svgDown = getByTitle(getByTestId('toggle'), 'triangle').parentElement

      expect(svgDown.getAttribute('transform')).toEqual('rotate(180)')
    })
  })
})
