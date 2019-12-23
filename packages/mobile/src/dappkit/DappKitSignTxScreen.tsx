import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { SignTxRequest } from '@celo/utils/src/dappkit'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { requestTxSignature } from 'src/dappkit/dappkit'
import { Namespaces, withTranslation } from 'src/i18n'
import DappkitExchangeIcon from 'src/icons/DappkitExchange'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const TAG = 'dappkit/DappKitSignTxScreen'

interface State {
  request: SignTxRequest
}

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

interface DispatchProps {
  requestTxSignature: typeof requestTxSignature
}

type Props = OwnProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  requestTxSignature,
}

class DappKitSignTxScreen extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  componentDidMount() {
    if (!this.props.navigation) {
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: SignTxRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    this.setState({ request })
  }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      ''
    )
  }

  linkBack = () => {
    navigateHome({ dispatchAfterNavigate: requestTxSignature(this.state.request) })
  }

  showDetails = () => {
    // TODO(sallyjyl): figure out which data to pass in for multitx
    navigate(Screens.DappKitTxDataScreen, { dappKitData: this.state.request.txs[0].txData })
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logo}>
            <DappkitExchangeIcon />
          </View>
          <Text style={styles.header}>
            {t('connectToWallet', { dappname: this.state.request.dappName })}
          </Text>

          <Text style={styles.share}> {t('shareInfo')} </Text>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('transaction.operation')}</Text>
            <Text style={styles.bodyText}>{t('transaction.signTX')}</Text>
            <Text style={styles.sectionHeaderText}>{t('transaction.data')}</Text>
            <TouchableOpacity onPress={this.showDetails}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('transaction.details')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text={t('allow')}
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
  space: {
    paddingHorizontal: 5,
  },
  sectionDivider: {
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...fontStyles.sectionLabel,
    ...fontStyles.semiBold,
    color: colors.dark,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 5,
  },
  bodyText: {
    ...fontStyles.paragraph,
    fontSize: 15,
    color: colors.darkSecondary,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
})

export default connect<null, DispatchProps>(
  null,
  mapDispatchToProps
)(withTranslation(Namespaces.dappkit)(DappKitSignTxScreen))
