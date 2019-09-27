import BaseNotification from '@celo/react-components/components/BaseNotification'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { PaymentRequest } from 'src/account'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import {
  addressToE164NumberSelector,
  AddressToE164NumberType,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { sendDollar } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
import PaymentRequestNotificationInner from 'src/paymentRequest/PaymentRequestNotificationInner'
import { NumberToRecipient, phoneNumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requests: PaymentRequest[]
}

type Props = OwnProps & WithNamespaces & StateProps

interface StateProps {
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

const mapStateToProps = (state: RootState): StateProps => ({
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  addressToE164Number: addressToE164NumberSelector(state),
  recipientCache: recipientCacheSelector(state),
})

const PREVIEW_SIZE = 2

// Payment Request notification for the notification center on home screen
export class PaymentRequestSummaryNotification extends React.Component<Props> {
  getCTA = () => {
    return [
      {
        text: this.props.t('review'),
        onPress: () => {
          CeloAnalytics.track(CustomEventNames.request_payment_review)
          navigate(Stacks.RequestStack)
        },
      },
    ]
  }

  getTotal() {
    return this.props.requests.length
  }

  getAdditionalRequestsCount() {
    if (this.getTotal() - PREVIEW_SIZE > 0) {
      return (
        <View style={styles.counter}>
          <Text style={[fontStyles.linkSmall, componentStyles.colorGreen]}>
            +{this.getTotal() - PREVIEW_SIZE}
          </Text>
        </View>
      )
    }
  }

  getTitle() {
    const { t } = this.props
    return this.getTotal() > 1
      ? t('paymentRequestWithCount', { count: this.getTotal() })
      : t('paymentRequest')
  }

  getRequesterRecipient = (requesterE164Number: string) => {
    return phoneNumberToRecipient(
      requesterE164Number,
      this.props.e164PhoneNumberAddressMapping[requesterE164Number],
      this.props.recipientCache
    )
  }

  render() {
    const { requests } = this.props

    return (
      <BaseNotification
        title={this.getTitle()}
        icon={<Image source={sendDollar} style={styles.image} resizeMode="contain" />}
        ctas={this.getCTA()}
        roundedBorders={true}
      >
        <View style={styles.body}>
          <View style={styles.requests}>
            {requests.slice(0, PREVIEW_SIZE).map((item, key) => {
              return (
                <PaymentRequestNotificationInner
                  key={key}
                  amount={item.amount}
                  comment={item.comment}
                  requesterE164Number={item.requesterE164Number}
                  requesterRecipient={this.getRequesterRecipient(item.requesterE164Number)}
                />
              )
            })}
          </View>
          {this.getAdditionalRequestsCount()}
        </View>
      </BaseNotification>
    )
  }
}

const styles = StyleSheet.create({
  body: {
    marginTop: 5,
    flexDirection: 'row',
  },
  image: {
    width: 30,
    height: 30,
  },
  requests: {
    flex: 1,
  },
  counter: {
    paddingLeft: variables.contentPadding,
    justifyContent: 'flex-end',
  },
})

export default componentWithAnalytics(
  connect<StateProps, {}, {}, RootState>(mapStateToProps)(
    withNamespaces(Namespaces.walletFlow5)(PaymentRequestSummaryNotification)
  )
)
