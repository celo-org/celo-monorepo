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

export type CalculateFeeChildren = (asyncResult: UseAsyncReturn<BigNumber, any>) => React.ReactNode

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
  amount: string
  comment?: string
  includeDekFee: boolean
  currency?: CURRENCY_ENUM
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
      const errMsg = asyncResult.error.message?.includes('insufficientBalance')
        ? ErrorMessages.INSUFFICIENT_BALANCE
        : ErrorMessages.CALCULATE_FEE_FAILED
      dispatch(showError(errMsg))
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

export const useSendFee = (props: Omit<SendProps, 'children'>): UseAsyncReturn<BigNumber> => {
  return useAsyncShowError(
    (
      account: string,
      recipientAddress: string,
      amount: string,
      comment: string = MAX_PLACEHOLDER_COMMENT,
      includeDekFee: boolean = false,
      currency: CURRENCY_ENUM = CURRENCY_ENUM.DOLLAR
    ) =>
      getSendFee(
        account,
        currency,
        {
          recipientAddress,
          amount,
          comment,
        },
        includeDekFee
      ),
    [
      props.account,
      props.recipientAddress,
      props.amount,
      props.comment,
      props.includeDekFee,
      props.currency,
    ]
  )
}

const CalculateSendFee: FunctionComponent<SendProps> = (props) => {
  const asyncResult = useSendFee(props)
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
