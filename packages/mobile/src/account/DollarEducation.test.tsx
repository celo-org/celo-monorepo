const { mockNavigationServiceFor } = require('test/utils')
const { navigateBack, navigate } = mockNavigationServiceFor('DollarEducation')

import { shallow } from 'enzyme'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DollarEducation, { DollarEducation as DollarEducationRaw } from 'src/account/DollarEducation'
import Education from 'src/account/Education'
import { setEducationCompleted } from 'src/stableToken/actions'
import { createMockStore } from 'test/utils'
const dollarEducationFactory = (
  simulateTarget: string,
  setEduComplete: typeof setEducationCompleted = jest.fn()
) => {
  const dollarEducation = shallow(<DollarEducationRaw setEducationCompleted={setEduComplete} />)
  dollarEducation.find(Education).simulate(simulateTarget)
  return dollarEducation
}

describe('DollarEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DollarEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('#goToSend', () => {
    it('sets EducationCompleted', () => {
      const setEduComplete = jest.fn()
      dollarEducationFactory('finish', setEduComplete)
      expect(setEduComplete).toBeCalled()
    })
    it('navigates to SendStack', () => {
      dollarEducationFactory('finish')
      expect(navigate).toBeCalled()
    })
  })

  describe('#goToWallet', () => {
    it('sets EducationCompleted', () => {
      const setEduComplete = jest.fn()
      dollarEducationFactory('finishAlternate', setEduComplete)
      expect(setEduComplete).toBeCalled()
    })
    it('navigatesBack', () => {
      const setEduComplete = jest.fn()
      dollarEducationFactory('finishAlternate', setEduComplete)
      expect(navigateBack).toBeCalled()
    })
  })
})
