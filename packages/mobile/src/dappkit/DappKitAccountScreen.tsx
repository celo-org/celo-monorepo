import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { AccountAuthRequest } from '@celo/utils/src/dappkit'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { approveAccountAuth } from 'src/dappkit/dappkit'
import { Namespaces, withTranslation } from 'src/i18n'
import DappkitExchangeIcon from 'src/icons/DappkitExchange'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

interface State {
  dappName: string | null
}
interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

interface StateProps {
  account: string | null
  phoneNumber: string | null
}

type Props = OwnProps & StateProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => ({
  account: currentAccountSelector(state),
  phoneNumber: e164NumberSelector(state),
})

class DappKitAccountAuthScreen extends React.Component<Props, State> {
  static navigationOptions = { header: null }
  state = {
    dappName: null,
  }

  componentDidMount() {
    if (!this.props.navigation) {
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: AccountAuthRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    this.setState({ dappName: request.dappName })
  }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      ''
    )
  }

  linkBack = () => {
    const { account, navigation, phoneNumber } = this.props

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
    if (!phoneNumber) {
      Logger.error(TAG, 'No phone number set up for this wallet')
      return
    }

    navigateHome({ dispatchAfterNavigate: approveAccountAuth(request) })
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t, account } = this.props
    const { dappName } = this.state
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logo}>
            <DappkitExchangeIcon />
          </View>
          {dappName && (
            <Text style={styles.header}>{t('connectToWallet', { dappname: dappName })}</Text>
          )}

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
      </SafeAreaView>
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
  bodyText: {
    ...fontStyles.paragraph,
    fontSize: 15,
    color: colors.darkSecondary,
    textAlign: 'center',
  },
})

export default connect<StateProps, null, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.dappkit)(DappKitAccountAuthScreen)
)
