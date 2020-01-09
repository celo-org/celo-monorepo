import {
  EventTypeNames,
  HomeExchangeFragment,
  HomeTransferFragment,
  UserTransactionsData,
} from 'src/apollo/types'
import { SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { TransactionTypes } from 'src/transactions/reducer'

export const invitedAddress = '0x1b173'

const exchangeDollar: HomeExchangeFragment = {
  __typename: EventTypeNames.Exchange,
  type: 'EXCHANGE' as TransactionTypes,
  hash: '1',
  inValue: 19080,
  timestamp: Date.now(),
  inSymbol: 'Celo Dollar',
  outSymbol: 'Celo Gold',
  outValue: 62252,
}

const exchangeGold: HomeExchangeFragment = {
  __typename: EventTypeNames.Exchange,
  type: 'EXCHANGE' as TransactionTypes,
  hash: '1',
  inValue: 190,
  timestamp: Date.now(),
  inSymbol: 'Celo Gold',
  outSymbol: 'Celo Dollar',
  outValue: 62,
}

const sent: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'SENT' as TransactionTypes,
  value: 987161,
  symbol: 'Celo Gold',
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}

const sentInvite: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'SENT' as TransactionTypes,
  value: 0.33,
  symbol: 'Celo Dollar',
  timestamp: Date.now(),
  address: invitedAddress,
  comment: SENTINEL_INVITE_COMMENT,
  hash: '0x1010',
}

const recieved: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'RECEIVED' as TransactionTypes,
  value: 587161,
  symbol: 'Celo Gold',
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const faucet: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'FAUCET' as TransactionTypes,
  value: 387161,
  symbol: 'Celo Dollar',
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const verificationFee: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'VERIFICATION_FEE' as TransactionTypes,
  value: 0.3,
  symbol: 'Celo Gold',
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const verificationReward: HomeTransferFragment = {
  __typename: EventTypeNames.Transfer,
  type: 'VERIFICATION_REWARD' as TransactionTypes,
  value: 9371,
  symbol: 'Celo Dollar',
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}

export const fakeUserTransactionData: UserTransactionsData = {
  events: [
    exchangeDollar,
    exchangeGold,
    sent,
    sentInvite,
    verificationReward,
    recieved,
    verificationFee,
    faucet,
  ],
}
