import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { Language } from 'src/language/Language'
import { getMockI18nProps } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders correctly', () => {
  const navigation: any = { getParam: jest.fn() }
  const tree = renderer.create(
    <Language setLanguage={jest.fn()} navigation={navigation} {...getMockI18nProps()} />
  )
  expect(tree).toMatchSnapshot()
})
