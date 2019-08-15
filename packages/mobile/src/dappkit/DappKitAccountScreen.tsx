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

          <Text style={styles.share}>{t('shareInfo')}</Text>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('address')}</Text>
            <Text style={styles.bodyText}>{account}</Text>
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
    paddingBottom: 30,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
  logo: {
    marginBottom: 20,
  },
  share: {
    ...fontStyles.bodySecondary,
    fontSize: 13,
    alignSelf: 'center',
  },
  space: {
    paddingHorizontal: 5,
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.bodyBold,
    textTransform: 'uppercase',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 5,
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
    ...fontStyles.paragraph,
    fontSize: 15,
    color: colors.darkSecondary,
    textAlign: 'center',
  },
})

export default connect<StateProps, null, {}, RootState>(mapStateToProps)(
  withNamespaces(Namespaces.dappkit)(DappKitAccountAuthScreen)
)
