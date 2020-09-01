import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { requestTxSignature } from 'src/dappkit/dappkit'
import { Namespaces, withTranslation } from 'src/i18n'
import { noHeader } from 'src/navigator/Headers.v2'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'

const TAG = 'dappkit/DappKitSignTxScreen'

interface DispatchProps {
  requestTxSignature: typeof requestTxSignature
}

type Props = DispatchProps &
  WithTranslation &
  StackScreenProps<StackParamList, Screens.DappKitSignTxScreen>

const mapDispatchToProps = {
  requestTxSignature,
}

class DappKitSignTxScreen extends React.Component<Props> {
  static navigationOptions = noHeader

  componentDidMount() {
    const request = this.props.route.params.dappKitRequest

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    this.setState({ request })
  }

  getRequest = () => {
    return this.props.route.params.dappKitRequest
  }

  linkBack = () => {
    const request = this.getRequest()

    navigateHome({ onAfterNavigate: () => this.props.requestTxSignature(request) })
  }

  showDetails = () => {
    const request = this.getRequest()

    // TODO(sallyjyl): figure out which data to pass in for multitx
    navigate(Screens.DappKitTxDataScreen, {
      dappKitData: request.txs[0].txData,
    })
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t } = this.props
    const request = this.getRequest()
    const { dappName } = request

    return (
      <SafeAreaView style={styles.container}>
        <TopBarTextButton
          title={t('cancel')}
          onPress={this.cancel}
          titleStyle={styles.cancelButton}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {!!dappName && <Text style={styles.header}>{t('connectToWallet', { dappName })}</Text>}

          <Text style={styles.share}> {t('shareInfo')} </Text>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('transaction.operation')}</Text>
            <Text style={styles.bodyText}>{t('transaction.signTX')}</Text>
            <Text style={styles.sectionHeaderText}>{t('transaction.data')}</Text>
            <TouchableOpacity onPress={this.showDetails}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('transaction.details')}</Text>
            </TouchableOpacity>
          </View>

          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={this.linkBack}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '15%',
  },
  header: {
    ...fontStyles.h1,
    alignItems: 'center',
    paddingBottom: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  space: {
    paddingHorizontal: 5,
  },
  sectionDivider: {
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
})

export default connect<null, DispatchProps>(
  null,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.dappkit)(DappKitSignTxScreen))
