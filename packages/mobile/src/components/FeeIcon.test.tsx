import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { ExchangeFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'

it('SecurityFeeIcon renders correctly', () => {
  const tree = renderer.create(<SecurityFeeIcon />)
  expect(tree).toMatchSnapshot()
})

it('ExchangeFeeIcon renders correctly', () => {
  const tree = renderer.create(<ExchangeFeeIcon />)
  expect(tree).toMatchSnapshot()
})
