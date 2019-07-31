import { getStableTokenContract } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import React, { FunctionComponent } from 'react'
import { useAsync, UseAsyncReturn } from 'react-async-hook'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'

export type CalculateFeeChildren = (asyncResult: UseAsyncReturn<BigNumber, never>) => any

interface CommonProps {
  children: CalculateFeeChildren
}

interface InviteProps extends CommonProps {
  feeType: FeeType.INVITE
}

interface SendProps extends CommonProps {
  feeType: FeeType.SEND
  account: string
  recipientAddress: string
  amount: BigNumber
  comment: string
}

interface ExchangeProps extends CommonProps {
  feeType: FeeType.EXCHANGE
  // TODO
}

interface ReclaimEscrowProps extends CommonProps {
  feeType: FeeType.RECLAIM_ESCROW
  account: string
  paymentID: string
}

export type Props = InviteProps | SendProps | ExchangeProps | ReclaimEscrowProps

// TODO: remove this once we use TS 3.5
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type PropsWithoutChildren =
  | Omit<InviteProps, 'children'>
  | Omit<SendProps, 'children'>
  | Omit<ExchangeProps, 'children'>
  | Omit<ReclaimEscrowProps, 'children'>

const CalculateInviteFee: FunctionComponent<InviteProps> = (props) => {
  const asyncResult = useAsync(getInvitationVerificationFee, [])
  return props.children(asyncResult)
}

const CalculateSendFee: FunctionComponent<SendProps> = (props) => {
  const asyncResult = useAsync(
    async (account: string, recipientAddress: string, amount: BigNumber, comment: string) =>
      getSendFee(account, getStableTokenContract, {
        recipientAddress,
        amount: amount.valueOf(),
        comment,
      }),
    [props.account, props.recipientAddress, props.amount, props.comment]
  )
  return props.children(asyncResult)
}

const CalculateReclaimEscrowFee: FunctionComponent<ReclaimEscrowProps> = (props) => {
  const asyncResult = useAsync(getReclaimEscrowFee, [props.account, props.paymentID])
  return props.children(asyncResult)
}

const CalculateFee: FunctionComponent<Props> = (props) => {
  switch (props.feeType) {
    case FeeType.INVITE:
      return <CalculateInviteFee {...props} />
    case FeeType.SEND:
      return <CalculateSendFee {...props} />
    case FeeType.RECLAIM_ESCROW:
      return <CalculateReclaimEscrowFee {...props} />
    case FeeType.EXCHANGE:
      return null
  }

  return null
}

export default CalculateFee
