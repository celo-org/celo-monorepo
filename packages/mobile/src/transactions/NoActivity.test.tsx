import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import NoActivity from 'src/transactions/NoActivity'
import { FeedType } from 'src/transactions/TransactionFeed'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders loading', () => {
  const tree = renderer.create(<NoActivity loading={true} kind={FeedType.HOME} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

it('renders exchange', () => {
  const tree = renderer.create(
    <NoActivity loading={false} kind={FeedType.EXCHANGE} error={undefined} />
  )
  expect(tree).toMatchSnapshot()
})

it('renders home', () => {
  const tree = renderer.create(
    <NoActivity loading={false} kind={FeedType.HOME} error={undefined} />
  )
  expect(tree).toMatchSnapshot()
})
