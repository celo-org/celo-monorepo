import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { TokenTransactionType } from 'src/apollo/types'
import BackButton from 'src/components/BackButton.v2'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { emptyHeader, HeaderTitleWithSubtitle } from 'src/navigator/Headers.v2'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import { getDatetimeDisplayString } from 'src/utils/time'

export interface NavigationPropsWrapper {
  reviewProps: ReviewProps
  confirmationProps: any
}

export interface ReviewProps {
  type: TokenTransactionType
  timestamp: number
  header: string
}

type Props = NavigationInjectedProps<NavigationPropsWrapper> & WithTranslation

class TransactionReviewScreen extends React.PureComponent<Props> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavigationPropsWrapper>) => {
    const { header, timestamp } = navigation.getParam('reviewProps')
    const dateTimeStatus = getDatetimeDisplayString(timestamp, i18n)
    return {
      ...emptyHeader,
      headerLeft: <BackButton color={colors.dark} />,
      headerTitle: <HeaderTitleWithSubtitle title={header} subTitle={dateTimeStatus} />,
    }
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

  renderCard = (type: TokenTransactionType, confirmationProps: any) => {
    switch (type) {
      case TokenTransactionType.Exchange:
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
        {this.renderCard(type, confirmationProps)}
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
