import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { EventTypeNames } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { TransactionTypes } from 'src/transactions/reducer'
import { TransferFeedItem } from 'src/transactions/TransferFeedItem'
import { createMockStore, getMockI18nProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAddressToE164Number,
  mockComment,
  mockE164Number,
  mockPrivateDEK,
  mockPrivateDEK2,
  mockRecipientCache,
} from 'test/values'

const invitee = {
  [mockAccount]: mockE164Number,
}
// Mock encrypted comment from account 1 to account 2.
// Generated with `encryptComment(mockComment, Buffer.from(mockPublicDEK2, 'hex'), Buffer.from(mockPublicDEK, 'hex')).comment` from '@celo/utils'
const encryptedMockComment =
  'BAChYK3v1R/Y1ixIKqhpT6BW9AqigzaHfCl/MTu4Sg6fp1ckDUHR4qMOyxG3UiMe1GrlpJ+Ce66NJh6VemaWkHD7tU3TCbyUHsLHXBwJ0nBwLqt9Lvqrp4MO7unbFYCofqhjZKH+9g3OFBr6TwvSg/JaY7CZiSjq0FPiA+hcmScJBJl12DcGnB+cNl97n7tdCGQZj+LY/ktPdPzH9wUtTNx+UKDjHfF06pWRPd3d7k0rO+ww01cKuh+8aBdS1oMA8HPFUttM2pcigqD1uTWaD/LCnGjYR5nVfSj5luaI/lqinRGHcCPlFzmflqbS3kpaCM/dolP8By7UC8V8leQ3tMI/JsrusWTRFkctBTCEqmk/Pd8/ezPVae8813EisGlsDC7Uxq3VDhkPMTVwrT2NjplqQ6CCLQ4aKvFAdZEo3e/iJWlXa5RKMTiRmpNjb5vhlIC0bWnAkMC17r/5poawS3SjWR+5RLFD+vsj0x/gErZaUCXxOVdiR1CURh1qZ9VyEUTxm1ZnZpC+tg=='

describe('transfer feed item renders correctly', () => {
  it('for sent transaction', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={mockComment}
          type={TransactionTypes.SENT}
          hash={'0x'}
          value={1}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent with encrypted comment', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={encryptedMockComment}
          type={TransactionTypes.SENT}
          hash={'0x'}
          value={1}
          address={mockAccount2}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={mockPrivateDEK}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received with encrypted comment', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={encryptedMockComment}
          type={TransactionTypes.RECEIVED}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={mockPrivateDEK2}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for verification fee', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.VERIFICATION_FEE}
          hash={'0x'}
          value={0.33}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for network fee', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.NETWORK_FEE}
          hash={'0x'}
          value={0.002}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for <0.000001 network fee', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.NETWORK_FEE}
          hash={'0x'}
          value={0.0000002}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for verification reward', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.VERIFICATION_REWARD}
          hash={'0x'}
          value={1}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for faucet', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.FAUCET}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent invite', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.INVITE_SENT}
          hash={'0x'}
          value={1}
          address={mockAccount}
          invitees={invitee}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received invite', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.INVITE_RECEIVED}
          hash={'0x'}
          value={1}
          address={mockAccount}
          invitees={invitee}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.RECEIVED}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known received', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.RECEIVED}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          recipientCache={mockRecipientCache}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.SENT}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          recipientCache={{}}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known sent', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <TransferFeedItem
          __typename={EventTypeNames.Transfer}
          comment={''}
          type={TransactionTypes.SENT}
          hash={'0x'}
          value={100}
          address={mockAccount}
          invitees={{}}
          symbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          recipientCache={mockRecipientCache}
          showLocalCurrency={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
