import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { connect } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import ExchangeConfirmationCard, {
  ExchangeConfirmationCardProps,
} from 'src/exchange/ExchangeConfirmationCard'
import { SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import TransferConfirmationCard, {
  TransferConfirmationCardProps,
} from 'src/transactions/TransferConfirmationCard'

interface StateProps {
  addressHasChanged: boolean
  recipientInfo: RecipientInfo
}
export interface ReviewProps {
  type: TokenTransactionType
  timestamp: number
  header: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.TransactionReview>
type Props = OwnProps & StateProps

const isTransferConfirmationCardProps = (
  confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
): confirmationProps is TransferConfirmationCardProps =>
  (confirmationProps as TransferConfirmationCardProps).type !== undefined

const hasAddressChanged = (
  confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
) => {
  if (!isTransferConfirmationCardProps(confirmationProps)) {
    return false
  }

  const { address, e164PhoneNumber } = confirmationProps
  if (!address || !e164PhoneNumber || !secureSendPhoneNumberMapping[e164PhoneNumber]) {
    return false
  }

  const newAddress = secureSendPhoneNumberMapping[e164PhoneNumber].address
  if (!newAddress || newAddress === address) {
    return false
  }

  return true
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const { confirmationProps } = ownProps.route.params
  const { secureSendPhoneNumberMapping } = state.identity
  const addressHasChanged = hasAddressChanged(confirmationProps, secureSendPhoneNumberMapping)
  const recipientInfo = recipientInfoSelector(state)

  return { addressHasChanged, recipientInfo }
}

function TransactionReview({ route, addressHasChanged, recipientInfo }: Props) {
  const { confirmationProps } = route.params

  if (isTransferConfirmationCardProps(confirmationProps)) {
    // @ts-ignore, address should never be undefined
    const recipient = getRecipientFromAddress(confirmationProps.address, recipientInfo)
    Object.assign(recipient, { e164PhoneNumber: confirmationProps.e164PhoneNumber })

    const props = { ...confirmationProps, addressHasChanged, recipient }
    return <TransferConfirmationCard {...props} />
  }

  return <ExchangeConfirmationCard {...confirmationProps} />
}

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps, {})(TransactionReview)
