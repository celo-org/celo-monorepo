import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import { TransferFeedItem } from 'src/transactions/TransferFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { createMockStore, getMockI18nProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAddressToE164Number,
  mockComment,
  mockE164Number,
  mockInviteDetails,
  mockInviteDetails2,
  mockPhoneRecipientCache,
  mockPrivateDEK,
  mockPrivateDEK2,
  mockRecipientCache,
  mockRecipientInfo,
} from 'test/values'

// Mock encrypted comment from account 1 to account 2.
// Generated with `encryptComment(mockComment, Buffer.from(mockPublicDEK2, 'hex'), Buffer.from(mockPublicDEK, 'hex')).comment` from '@celo/utils'
const encryptedMockComment =
  'BAChYK3v1R/Y1ixIKqhpT6BW9AqigzaHfCl/MTu4Sg6fp1ckDUHR4qMOyxG3UiMe1GrlpJ+Ce66NJh6VemaWkHD7tU3TCbyUHsLHXBwJ0nBwLqt9Lvqrp4MO7unbFYCofqhjZKH+9g3OFBr6TwvSg/JaY7CZiSjq0FPiA+hcmScJBJl12DcGnB+cNl97n7tdCGQZj+LY/ktPdPzH9wUtTNx+UKDjHfF06pWRPd3d7k0rO+ww01cKuh+8aBdS1oMA8HPFUttM2pcigqD1uTWaD/LCnGjYR5nVfSj5luaI/lqinRGHcCPlFzmflqbS3kpaCM/dolP8By7UC8V8leQ3tMI/JsrusWTRFkctBTCEqmk/Pd8/ezPVae8813EisGlsDC7Uxq3VDhkPMTVwrT2NjplqQ6CCLQ4aKvFAdZEo3e/iJWlXa5RKMTiRmpNjb5vhlIC0bWnAkMC17r/5poawS3SjWR+5RLFD+vsj0x/gErZaUCXxOVdiR1CURh1qZ9VyEUTxm1ZnZpC+tg=='

const mockStore = createMockStore()

describe('transfer feed item renders correctly', () => {
  it('for sent transaction', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={mockComment}
          type={TokenTransactionType.Sent}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent with encrypted comment', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={encryptedMockComment}
          type={TokenTransactionType.Sent}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount2}
          timestamp={1}
          commentKey={mockPrivateDEK}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received with encrypted comment', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={encryptedMockComment}
          type={TokenTransactionType.Received}
          hash={'0x'}
          amount={{ value: '100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={mockPrivateDEK2}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for verification fee', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.VerificationFee}
          hash={'0x'}
          amount={{ value: '-0.33', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for network fee', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.NetworkFee}
          hash={'0x'}
          amount={{ value: '-0.002', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for <0.000001 network fee', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.NetworkFee}
          hash={'0x'}
          amount={{ value: '-0.0000002', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for verification reward', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.VerificationReward}
          hash={'0x'}
          amount={{ value: '1', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for faucet', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Faucet}
          hash={'0x'}
          amount={{ value: '100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent invite', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.InviteSent}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          address={mockInviteDetails.e164Number}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known sent invite', () => {
    const mockStoredInviteDetails = {
      timestamp: 10,
      e164Number: mockInviteDetails.e164Number,
      tempWalletAddress: '0x',
      tempWalletPrivateKey: 'secretkey',
      tempWalletRedeemed: false,
      inviteCode: 'join me!',
      inviteLink: 'joinme.com',
    }
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.InviteSent}
          hash={'0x'}
          amount={{ value: '-1', currencyCode: 'cUSD', localAmount: null }}
          address={mockInviteDetails.e164Number}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[mockStoredInviteDetails]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received invite', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.InviteReceived}
          hash={'0x'}
          amount={{ value: '1', currencyCode: 'cUSD', localAmount: null }}
          address={mockInviteDetails2.e164Number}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for received', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Received}
          hash={'0x'}
          amount={{ value: '100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known received', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Received}
          hash={'0x'}
          amount={{ value: '100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for sent', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Sent}
          hash={'0x'}
          amount={{ value: '-100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={{}}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known sent', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Sent}
          hash={'0x'}
          amount={{ value: '-100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          phoneRecipientCache={mockPhoneRecipientCache}
          recipientInfo={mockRecipientInfo}
          recentTxRecipientsCache={{}}
          invitees={[]}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('for known sent without recipient cache populated', () => {
    const tree = renderer.create(
      <Provider store={mockStore}>
        <TransferFeedItem
          __typename="TokenTransfer"
          status={TransactionStatus.Complete}
          comment={''}
          type={TokenTransactionType.Sent}
          hash={'0x'}
          amount={{ value: '-100', currencyCode: 'cUSD', localAmount: null }}
          address={mockAccount}
          timestamp={1}
          commentKey={null}
          addressToE164Number={mockAddressToE164Number}
          phoneRecipientCache={mockRecipientCache}
          recentTxRecipientsCache={mockRecipientCache}
          invitees={[]}
          recipientInfo={mockRecipientInfo}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  const renderFeedItemForSendWithoutCaches = (address: string) => (
    <TransferFeedItem
      __typename="TokenTransfer"
      status={TransactionStatus.Complete}
      comment={''}
      type={TokenTransactionType.Sent}
      hash={'0x'}
      amount={{ value: '-100', currencyCode: 'cUSD', localAmount: null }}
      address={address}
      timestamp={1}
      commentKey={null}
      addressToE164Number={mockAddressToE164Number}
      phoneRecipientCache={mockPhoneRecipientCache}
      recipientInfo={mockRecipientInfo}
      recentTxRecipientsCache={{}}
      invitees={[]}
    />
  )
  it('for known address display name show stored name on feed item', () => {
    const contactName = 'Some name'
    const tree = render(
      <Provider
        store={createMockStore({
          identity: {
            addressToDisplayName: {
              [mockAccount]: {
                name: contactName,
              },
            },
          },
        })}
      >
        {renderFeedItemForSendWithoutCaches(mockAccount)}
      </Provider>
    )
    expect(tree.queryByText(contactName)).toBeTruthy()
    expect(tree.queryByText(mockE164Number)).toBeFalsy()
  })
  it('for unknown address display name show phone number on feed item', () => {
    const contactName = 'Some name'
    const tree = render(
      <Provider
        store={createMockStore({
          identity: {
            addressToDisplayName: {
              [mockAccount2]: {
                name: contactName,
              },
            },
          },
        })}
      >
        {renderFeedItemForSendWithoutCaches(mockAccount)}
      </Provider>
    )
    expect(tree.queryByText(contactName)).toBeFalsy()
    expect(tree.queryByText(mockE164Number)).toBeTruthy()
  })
})
