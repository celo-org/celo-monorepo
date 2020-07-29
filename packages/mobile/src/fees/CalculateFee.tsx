import { CURRENCY_ENUM } from '@celo/utils/src'
import BigNumber from 'bignumber.js'
import React, { FunctionComponent, useEffect } from 'react'
import { useAsync, UseAsyncReturn } from 'react-async-hook'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { FeeType } from 'src/fees/actions'
import { getInviteFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'
import Logger from 'src/utils/Logger'

export type CalculateFeeChildren = (
  asyncResult: UseAsyncReturn<BigNumber, never>
) => React.ReactNode

interface CommonProps {
  children: CalculateFeeChildren
}

interface InviteProps extends CommonProps {
  feeType: FeeType.INVITE
  account: string
  amount: BigNumber
  comment?: string
}

interface SendProps extends CommonProps {
  feeType: FeeType.SEND
  account: string
  recipientAddress: string
  amount: BigNumber
  comment?: string
  includeDekFee: boolean
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

// TODO: remove this once we use TS 3.5
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type PropsWithoutChildren =
  | Omit<InviteProps, 'children'>
  | Omit<SendProps, 'children'>
  | Omit<ExchangeProps, 'children'>
  | Omit<ReclaimEscrowProps, 'children'>

type Props = InviteProps | SendProps | ExchangeProps | ReclaimEscrowProps

// Max lengthed comment to fetch fee estimate before user finalizes comment
const MAX_PLACEHOLDER_COMMENT: string = '0'.repeat(MAX_COMMENT_LENGTH)

function useAsyncShowError<R, Args extends any[]>(
  asyncFunction: ((...args: Args) => Promise<R>) | (() => Promise<R>),
  params: Args
): UseAsyncReturn<R, Args> {
  const asyncResult = useAsync(asyncFunction, params)
  const dispatch = useDispatch()

  useEffect(() => {
    // Generic error banner
    if (asyncResult.error) {
      Logger.error('CalculateFee', 'Error calculating fee', asyncResult.error)
      dispatch(showError(ErrorMessages.CALCULATE_FEE_FAILED))
    }
  }, [asyncResult.error])

  return asyncResult
}

const CalculateInviteFee: FunctionComponent<InviteProps> = (props) => {
  const asyncResult = useAsyncShowError(
    (account: string, amount: BigNumber, comment: string = MAX_PLACEHOLDER_COMMENT) =>
      getInviteFee(account, CURRENCY_ENUM.DOLLAR, amount.valueOf(), comment),
    [props.account, props.amount, props.comment]
  )
  return props.children(asyncResult) as React.ReactElement
}

const CalculateSendFee: FunctionComponent<SendProps> = (props) => {
  const asyncResult = useAsyncShowError(
    (
      account: string,
      recipientAddress: string,
      amount: BigNumber,
      comment: string = MAX_PLACEHOLDER_COMMENT,
      includeDekFee: boolean = false
    ) =>
      getSendFee(
        account,
        CURRENCY_ENUM.DOLLAR,
        {
          recipientAddress,
          amount: amount.valueOf(),
          comment,
        },
        includeDekFee
      ),
    [props.account, props.recipientAddress, props.amount, props.comment, props.includeDekFee]
  )
  return props.children(asyncResult) as React.ReactElement
}

const CalculateReclaimEscrowFee: FunctionComponent<ReclaimEscrowProps> = (props) => {
  const asyncResult = useAsyncShowError(getReclaimEscrowFee, [props.account, props.paymentID])
  return props.children(asyncResult) as React.ReactElement
}

const CalculateFee = (props: Props) => {
  switch (props.feeType) {
    case FeeType.INVITE:
      return <CalculateInviteFee {...props} />
    case FeeType.SEND:
      return <CalculateSendFee {...props} />
    case FeeType.RECLAIM_ESCROW:
      return <CalculateReclaimEscrowFee {...props} />
  }

  throw new Error(`Unsupported feeType: ${props.feeType}`)
}

export default CalculateFee
