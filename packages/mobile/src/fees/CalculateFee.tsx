import { getStableTokenContract } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import React, { FunctionComponent, useEffect } from 'react'
import { useAsync, UseAsyncReturn } from 'react-async-hook'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ERROR_BANNER_DURATION } from 'src/config'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { FeeType } from 'src/fees/actions'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { getSendFee } from 'src/send/saga'

export type CalculateFeeChildren = (
  asyncResult: UseAsyncReturn<BigNumber, never>
) => React.ReactNode

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

type OwnProps = InviteProps | SendProps | ExchangeProps | ReclaimEscrowProps

// TODO: remove this once we use TS 3.5
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type PropsWithoutChildren =
  | Omit<InviteProps, 'children'>
  | Omit<SendProps, 'children'>
  | Omit<ExchangeProps, 'children'>
  | Omit<ReclaimEscrowProps, 'children'>

interface DispatchProps {
  showError: typeof showError
}

type Props = DispatchProps & OwnProps

const mapDispatchToProps = {
  showError,
}

function useAsyncShowError<R, Args extends any[]>(
  asyncFunction: ((...args: Args) => Promise<R>) | (() => Promise<R>),
  params: Args,
  showErrorFunction: typeof showError
): UseAsyncReturn<R, Args> {
  const asyncResult = useAsync(asyncFunction, params)

  useEffect(() => {
    // Generic error banner
    if (asyncResult.error) {
      showErrorFunction(ErrorMessages.CALCULATE_FEE_FAILED, ERROR_BANNER_DURATION)
    }
  }, [asyncResult.error])

  return asyncResult
}

const CalculateInviteFee: FunctionComponent<DispatchProps & InviteProps> = (props) => {
  const asyncResult = useAsyncShowError(getInvitationVerificationFee, [], props.showError)
  return props.children(asyncResult) as React.ReactElement
}

const CalculateSendFee: FunctionComponent<DispatchProps & SendProps> = (props) => {
  const asyncResult = useAsyncShowError(
    (account: string, recipientAddress: string, amount: BigNumber, comment: string) =>
      getSendFee(account, getStableTokenContract, {
        recipientAddress,
        amount: amount.valueOf(),
        comment,
      }),
    [props.account, props.recipientAddress, props.amount, props.comment],
    props.showError
  )
  return props.children(asyncResult) as React.ReactElement
}

const CalculateReclaimEscrowFee: FunctionComponent<DispatchProps & ReclaimEscrowProps> = (
  props
) => {
  const asyncResult = useAsyncShowError(
    getReclaimEscrowFee,
    [props.account, props.paymentID],
    props.showError
  )
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

export default connect<{}, DispatchProps, OwnProps, {}>(
  null,
  mapDispatchToProps
)(CalculateFee)
