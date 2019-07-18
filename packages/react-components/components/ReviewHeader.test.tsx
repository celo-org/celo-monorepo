import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import { shallow } from 'enzyme'
import * as React from 'react'

describe('ReviewHeader', () => {
  describe('when just title', () => {
    it('renders title', () => {
      const review = shallow(<ReviewHeader title="God is a Miner" />)
      expect(review.find({ children: 'God is a Miner' }).length).toEqual(1)
    })
  })
  describe('subtitle is passed too', () => {
    it('renders subtitle', () => {
      const review = shallow(<ReviewHeader title="God is a Miner" subtitle={'Off the Chain'} />)
      expect(review.find({ children: 'God is a Miner' }).length).toEqual(1)
      expect(review.find({ children: 'Off the Chain' }).length).toEqual(1)
    })
  })
})
