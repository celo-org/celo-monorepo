import { BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { GethAwareButton } from 'src/geth/GethAwareButton'

it('renders correctly when disconnected', () => {
  const tree = renderer.create(
    <GethAwareButton
      onPress={jest.fn()}
      connected={false}
      text={'Celo Button'}
      type={BtnTypes.TERTIARY}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when connected', () => {
  const tree = renderer.create(
    <GethAwareButton
      onPress={jest.fn()}
      connected={true}
      text={'Celo Button'}
      type={BtnTypes.TERTIARY}
    />
  )
  expect(tree).toMatchSnapshot()
})
