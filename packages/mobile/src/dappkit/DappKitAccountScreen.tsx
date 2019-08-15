import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  produceResponseDeeplink,
} from '@celo/utils/src/dappkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { Namespaces } from 'src/i18n'
import DappkitExchangeIcon from 'src/icons/DappkitExchange'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

interface StateProps {
  account: string | null
}

type Props = OwnProps & StateProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  account: currentAccountSelector(state),
})

class DappKitAccountAuthScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      ''
    )
  }

  linkBack = () => {
    const { account, navigation } = this.props

    if (!navigation) {
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: AccountAuthRequest = navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    if (!account) {
      Logger.error(TAG, 'No account set up for this wallet')
      return
    }

    navigate(Screens.WalletHome)
    Linking.openURL(produceResponseDeeplink(request, AccountAuthResponseSuccess(account)))
  }

  prettifyAddress = (address: string | null) => {
    if (!address) {
      return
    }

    return '0x '.concat(
      // @ts-ignore
      address
        .substring(2)
        .match(/.{1,4}/g)
        .join(' ')
    )
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t, account } = this.props
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logo}>
            <DappkitExchangeIcon />
          </View>
          <Text style={styles.header}>{t('connectToWallet')}</Text>

          <View style={styles.sectionDivider}>
            <View style={styles.lineDivider} />
            <View style={styles.space}>
              <Text style={styles.connect}> {t('connect')} </Text>
            </View>
          </View>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('address')}</Text>
            <Text style={styles.bodyText}>{this.prettifyAddress(account)}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text={t('connect')}
            onPress={this.linkBack}
            standard={false}
            type={BtnTypes.PRIMARY}
          />
          <Button
            text={t('cancel')}
            onPress={this.cancel}
            standard={false}
            type={BtnTypes.SECONDARY}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '15%',
  },
  header: {
    ...fontStyles.h1,
    alignItems: 'center',
    marginBottom: 30,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
  logo: {
    marginBottom: 20,
  },
  connect: {
    ...fontStyles.sectionLabel,
    color: colors.inactive,
    alignSelf: 'center',
    backgroundColor: colors.background,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  space: {
    paddingHorizontal: 5,
    height: 20,
  },
  sectionDivider: {
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...fontStyles.bodyBold,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: 20,
  },
  lineDivider: {
    position: 'absolute',
    justifyContent: 'flex-start',
    top: '50%',
    width: '100%',
    borderTopWidth: 1,
    borderColor: colors.inactive,
  },
  bodyText: {
    ...fontStyles.bodySmall,
    color: colors.darkSecondary,
    marginHorizontal: '5%',
    textAlign: 'center',
  },
})

export default connect<StateProps, null, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.dappkit)(DappKitAccountAuthScreen)
)
