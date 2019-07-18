const { mockNavigationServiceFor } = require('test/utils')
const { navigateBack, navigate } = mockNavigationServiceFor('GoldEducation')

import { shallow } from 'enzyme'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Education from 'src/account/Education'
import GoldEducation, { GoldEducation as GoldEducationRaw } from 'src/account/GoldEducation'
import { setEducationCompleted } from 'src/goldToken/actions'
import { createMockStore } from 'test/utils'

const goldEducationFactory = (
  simulateTarget: string,
  setEduComplete: typeof setEducationCompleted = jest.fn()
) => {
  const goldEducation = shallow(<GoldEducationRaw setEducationCompleted={setEduComplete} />)
  goldEducation.find(Education).simulate(simulateTarget)
  return goldEducation
}

describe('GoldEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <GoldEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('#goToSend', () => {
    it('sets EducationCompleted', () => {
      const setEduComplete = jest.fn()
      goldEducationFactory('finish', setEduComplete)
      expect(setEduComplete).toBeCalled()
    })
    it('navigates to SendStack', () => {
      goldEducationFactory('finish')
      expect(navigate).toBeCalled()
    })
  })

  describe('#goToWallet', () => {
    it('sets EducationCompleted', () => {
      const setEduComplete = jest.fn()
      goldEducationFactory('finishAlternate', setEduComplete)
      expect(setEduComplete).toBeCalled()
    })
    it('navigatesBack', () => {
      const setEduComplete = jest.fn()
      goldEducationFactory('finishAlternate', setEduComplete)
      expect(navigateBack).toBeCalled()
    })
  })
})
