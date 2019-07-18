import SmallButton from '@celo/react-components/components/SmallButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { exchangeIcon, shinyDollar } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { FeedType } from 'src/transactions/TransactionFeed'

const goToSend = () => {
  navigate(Screens.SendStack)
}

interface OwnProps {
  kind: FeedType
  loading: boolean
  error: ApolloError | undefined
}

type Props = OwnProps & WithNamespaces

export class NoActivity extends React.PureComponent<Props> {
  render() {
    const { kind, loading, error, t } = this.props

    if (error) {
      return (
        <View style={styles.container}>
          <View style={styles.circleRed} />
          <Text style={[fontStyles.bodySecondary, styles.text]}>{t('errorLoadingActivity.0')}</Text>
          <Text style={[fontStyles.bodySecondary, styles.text]}>{t('errorLoadingActivity.1')}</Text>
        </View>
      )
    }

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator style={styles.icon} size="large" color={colors.celoGreen} />
          <Text style={[fontStyles.bodySecondary, styles.text]}>{t('loadingActivity')}</Text>
        </View>
      )
    }

    const image = kind === FeedType.EXCHANGE ? exchangeIcon : shinyDollar
    const statusText =
      kind === FeedType.EXCHANGE ? t('noExchangeActivity') : t('noTransactionActivity')

    return (
      <View style={styles.container}>
        <Image style={styles.icon} source={image} resizeMode={'contain'} />
        <Text style={[fontStyles.bodySecondary, styles.text]}>{statusText} </Text>
        {kind === FeedType.HOME && (
          <SmallButton
            onPress={goToSend}
            text={t('sendCeloDollars')}
            solid={true}
            style={styles.button}
          />
        )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  icon: {
    marginVertical: 20,
    height: 108,
    width: 108,
  },
  text: {
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    marginTop: 20,
    alignSelf: 'center',
  },
  circleRed: {
    marginVertical: 20,
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: colors.errorRed,
  },
})

export default withNamespaces('walletFlow5')(NoActivity)
