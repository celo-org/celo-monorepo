import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { requestTxSignature } from 'src/dappkit/dappkit'
import { Namespaces, withTranslation } from 'src/i18n'
import DappkitExchangeIcon from 'src/icons/DappkitExchange'
import { noHeader } from 'src/navigator/Headers.v2'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logo}>
            <DappkitExchangeIcon />
          </View>
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
)(withTranslation<Props>(Namespaces.dappkit)(DappKitSignTxScreen))
