import { HomeExchangeFragment, HomeTransferFragment, UserTransactionsData } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { TransactionTypes, TransferTransactionTypes } from 'src/transactions/reducer'

export const invitedAddress = '0x1b173'

const exchangeDollar: HomeExchangeFragment = {
  type: 'EXCHANGE' as TransactionTypes.EXCHANGE,
  hash: '1',
  inValue: 19080,
  timestamp: Date.now(),
  inSymbol: 'Celo Dollar' as CURRENCY_ENUM,
  outSymbol: 'Celo Gold' as CURRENCY_ENUM,
  outValue: 62252,
}

const exchangeGold: HomeExchangeFragment = {
  type: 'EXCHANGE' as TransactionTypes.EXCHANGE,
  hash: '1',
  inValue: 190,
  timestamp: Date.now(),
  inSymbol: 'Celo Gold' as CURRENCY_ENUM,
  outSymbol: 'Celo Dollar' as CURRENCY_ENUM,
  outValue: 62,
}

const sent: HomeTransferFragment = {
  type: 'SENT' as TransferTransactionTypes,
  value: 987161,
  symbol: 'Celo Gold' as CURRENCY_ENUM,
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}

const sentInvite: HomeTransferFragment = {
  type: 'SENT' as TransferTransactionTypes,
  value: 0.33,
  symbol: 'Celo Dollar' as CURRENCY_ENUM,
  timestamp: Date.now(),
  address: invitedAddress,
  comment: SENTINEL_INVITE_COMMENT,
  hash: '0x1010',
}

const recieved: HomeTransferFragment = {
  type: 'RECEIVED' as TransferTransactionTypes,
  value: 587161,
  symbol: 'Celo Gold' as CURRENCY_ENUM,
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const faucet: HomeTransferFragment = {
  type: 'FAUCET' as TransferTransactionTypes,
  value: 387161,
  symbol: 'Celo Dollar' as CURRENCY_ENUM,
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const verificationFee: HomeTransferFragment = {
  type: 'VERIFICATION_FEE' as TransferTransactionTypes,
  value: 0.3,
  symbol: 'Celo Gold' as CURRENCY_ENUM,
  timestamp: Date.now(),
  address: '0x423043cca38e75d7913504fedfd1dd4539cc55b3',
  comment: 'FAKE FAKE FAKE',
  hash: '01010',
}
const verificationReward: HomeTransferFragment = {
  type: 'VERIFICATION_REWARD' as TransferTransactionTypes,
  value: 9371,
  symbol: 'Celo Dollar' as CURRENCY_ENUM,
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
