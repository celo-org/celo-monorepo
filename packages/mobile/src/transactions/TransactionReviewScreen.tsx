import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import { TransactionTypes } from 'src/transactions/reducer'
import { getDatetimeDisplayString } from 'src/utils/time'

export interface NavigationPropsWrapper {
  reviewProps: ReviewProps
  confirmationProps: any
}

export interface ReviewProps {
  type: TransactionTypes
  timestamp: number
  header: string
}

type Props = NavigationInjectedProps<NavigationPropsWrapper> & WithTranslation

class TransactionReviewScreen extends React.PureComponent<Props> {
  static navigationOptions = { header: null }

  navigateToMain = () => {
    navigate(Screens.WalletHome)
  }

  getNavigationProps = (): ReviewProps => {
    const { type, timestamp, header } = this.props.navigation.getParam('reviewProps')

    if (type === undefined || timestamp === undefined) {
      throw new Error('Missing review props')
    }

    return {
      type,
      timestamp,
      header,
    }
  }

  getConfirmationProps = (): any => {
    const confirmationProps = this.props.navigation.getParam('confirmationProps')

    if (confirmationProps === undefined) {
      throw new Error('Missing confirmation props')
    }

    return confirmationProps
  }

  renderHeader = () => {
    const { t, i18n } = this.props
    const { header, timestamp } = this.getNavigationProps()
    const dateTimeStatus = getDatetimeDisplayString(timestamp, t, i18n)
    return <ReviewHeader title={header} subtitle={dateTimeStatus} />
  }

  renderCard = (type: TransactionTypes, confirmationProps: any) => {
    switch (type) {
      case TransactionTypes.EXCHANGE:
        return <ExchangeConfirmationCard {...confirmationProps} />
      default:
        return <TransferConfirmationCard {...confirmationProps} />
    }
  }

  render() {
    const { type } = this.getNavigationProps()
    const confirmationProps = this.getConfirmationProps()

    return (
      <SafeAreaView style={styles.container}>
        <ReviewFrame HeaderComponent={this.renderHeader} navigateBack={navigateBack}>
          {this.renderCard(type, confirmationProps)}
        </ReviewFrame>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default withTranslation(Namespaces.global)(TransactionReviewScreen)
