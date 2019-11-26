import colors from '@celo/react-components/styles/colors'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { getOutgoingPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import { updatePaymentRequestNotified, updatePaymentRequestStatus } from 'src/firebase/actions'
import i18n, { Namespaces } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import { headerWithBackButton } from 'src/navigator/Headers'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import PaymentRequestBalance from 'src/paymentRequest/PaymentRequestBalance'
import PaymentRequestListEmpty from 'src/paymentRequest/PaymentRequestListEmpty'
import { getRecipientFromPaymentRequest } from 'src/paymentRequest/utils'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'

const { contentPadding } = variables

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  updatePaymentRequestNotified: typeof updatePaymentRequestNotified
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getOutgoingPaymentRequests(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
})

type Props = WithNamespaces & StateProps & DispatchProps

export class OutgoingPaymentRequestListScreen extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('paymentRequestFlow:outgoingPaymentRequests'),
  })

  renderRequest = (request: PaymentRequest, key: number, allRequests: PaymentRequest[]) => {
    const { recipientCache } = this.props
    const requester = getRecipientFromPaymentRequest(request, recipientCache)

    return (
      <View key={key}>
        <OutgoingPaymentRequestListItem
          id={request.uid || ''}
          amount={request.amount}
          updatePaymentRequestStatus={this.props.updatePaymentRequestStatus}
          updatePaymentRequestNotified={this.props.updatePaymentRequestNotified}
          requester={requester}
          comment={request.comment}
        />
        {key < allRequests.length - 1 && <View style={styles.separator} />}
      </View>
    )
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <DisconnectBanner />
        <PaymentRequestBalance dollarBalance={this.props.dollarBalance} />
        {this.props.paymentRequests.length > 0 ? (
          <ScrollView>
            <View style={[componentStyles.roundedBorder, styles.scrollArea]}>
              {this.props.paymentRequests.map(this.renderRequest)}
            </View>
          </ScrollView>
        ) : (
          <PaymentRequestListEmpty />
        )}
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  separator: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    marginLeft: 50,
  },
  scrollArea: {
    margin: contentPadding,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    updatePaymentRequestStatus,
    updatePaymentRequestNotified,
    fetchPhoneAddresses,
  }
)(withNamespaces(Namespaces.paymentRequestFlow)(OutgoingPaymentRequestListScreen))
