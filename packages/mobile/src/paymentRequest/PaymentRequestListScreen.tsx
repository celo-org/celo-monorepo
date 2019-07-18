import SectionHeader from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { getPaymentRequests } from 'src/account/selectors'
import { PaymentRequest } from 'src/account/types'
import BackButton from 'src/components/BackButton'
import { updatePaymentRequestStatus } from 'src/firebase/actions'
import i18n, { Namespaces } from 'src/i18n'
import { fetchPhoneAddresses } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import PaymentRequestBalance from 'src/paymentRequest/PaymentRequestBalance'
import PaymentRequestListEmpty from 'src/paymentRequest/PaymentRequestListEmpty'
import PaymentRequestNotification from 'src/paymentRequest/PaymentRequestNotification'
import { RootState } from 'src/redux/reducers'
import { recipientCacheSelector } from 'src/send/reducers'
import { getSuggestedFeeDollars } from 'src/send/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { NumberToRecipient, phoneNumberToRecipient } from 'src/utils/recipient'

const { contentPadding } = variables

interface StateProps {
  dollarBalance: string | null
  paymentRequests: PaymentRequest[]
  fee: BigNumber
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  updatePaymentRequestStatus: typeof updatePaymentRequestStatus
  fetchPhoneAddresses: typeof fetchPhoneAddresses
}

const mapStateToProps = (state: RootState): StateProps => ({
  dollarBalance: state.stableToken.balance,
  paymentRequests: getPaymentRequests(state),
  fee: getSuggestedFeeDollars(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
})

type Props = WithNamespaces & StateProps & DispatchProps

export class PaymentRequestListScreen extends React.Component<Props> {
  static navigationOptions = () => ({
    headerTitle: i18n.t('paymentRequestFlow:paymentRequests'),
    headerLeft: <BackButton />,
    headerRight: <View />,
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  })

  getRequesterRecipient = (requesterE164Number: string) => {
    return phoneNumberToRecipient(
      requesterE164Number,
      this.props.e164PhoneNumberAddressMapping[requesterE164Number],
      this.props.recipientCache
    )
  }

  componentDidMount = () => {
    const { paymentRequests, e164PhoneNumberAddressMapping } = this.props
    const missingAddresses = Array.from(
      new Set(
        paymentRequests
          .map((paymentRequest) => paymentRequest.requesterE164Number)
          .filter((e164Number) => !e164PhoneNumberAddressMapping[e164Number])
      )
    )
    if (missingAddresses && missingAddresses.length) {
      // fetch missing addresses and update the mapping
      this.props.fetchPhoneAddresses(Array.from(missingAddresses))
    }
  }

  renderRequest = (request: PaymentRequest, key: number, allRequests: PaymentRequest[]) => {
    return (
      <View key={key}>
        <PaymentRequestNotification
          id={request.uid || ''}
          amount={request.amount}
          updatePaymentRequestStatus={this.props.updatePaymentRequestStatus}
          requester={this.getRequesterRecipient(request.requesterE164Number)}
          comment={request.comment}
          fee={this.props.fee}
        />
        {key < allRequests.length - 1 && <View style={styles.separator} />}
      </View>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <DisconnectBanner />
        <PaymentRequestBalance dollarBalance={this.props.dollarBalance} />
        <SectionHeader text={this.props.t('requests')} />
        {this.props.paymentRequests.length > 0 ? (
          <ScrollView>
            <View style={[componentStyles.roundedBorder, styles.scrollArea]}>
              {this.props.paymentRequests.map(this.renderRequest)}
            </View>
          </ScrollView>
        ) : (
          <PaymentRequestListEmpty />
        )}
      </View>
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
    fetchPhoneAddresses,
  }
)(withNamespaces(Namespaces.paymentRequestFlow)(PaymentRequestListScreen))
