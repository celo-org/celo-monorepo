import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import ExchangeConfirmationCard, {
  ExchangeConfirmationCardProps,
} from 'src/exchange/ExchangeConfirmationCard'
import { Namespaces, withTranslation } from 'src/i18n'
import { SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import TransferConfirmationCard, {
  TransferConfirmationCardProps,
} from 'src/send/TransferConfirmationCard'

interface StateProps {
  addressHasChanged: boolean
}
export interface ReviewProps {
  type: TokenTransactionType
  timestamp: number
  header: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.TransactionReview>
type Props = WithTranslation & OwnProps & StateProps

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

  return { addressHasChanged }
}

class TransactionReview extends React.PureComponent<Props> {
  static navigationOptions = { header: null }

  navigateToMain = () => {
    navigateHome()
  }

  renderCard = (
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  ) => {
    if (isTransferConfirmationCardProps(confirmationProps)) {
      const props = { ...confirmationProps, addressHasChanged: this.props.addressHasChanged }
      return <TransferConfirmationCard {...props} />
    }

    return <ExchangeConfirmationCard {...confirmationProps} />
  }

  render() {
    const { confirmationProps } = this.props.route.params

    return (
      <SafeAreaView style={styles.container}>{this.renderCard(confirmationProps)}</SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default connect<StateProps, {}, OwnProps, RootState>(
  mapStateToProps,
  {}
)(withTranslation(Namespaces.global)(TransactionReview))
