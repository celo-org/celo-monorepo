import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { SignTxRequest } from '@celo/utils/src/dappkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { requestTxSignature } from 'src/dappkit/dappkit'
import { Namespaces } from 'src/i18n'
import DappkitExchangeIcon from 'src/icons/DappkitExchange'
import { navigateBack } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'

const TAG = 'dappkit/DappKitSignTxScreen'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

interface DispatchProps {
  requestTxSignature: typeof requestTxSignature
}

type Props = OwnProps & DispatchProps & WithNamespaces

const mapDispatchToProps = {
  requestTxSignature,
}

class DappKitSignTxScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      ''
    )
  }

  linkBack = () => {
    if (!this.props.navigation) {
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: SignTxRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    this.props.requestTxSignature(request)
  }

  showDetails = () => {
    this.setState({ visibleModal: true })
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t } = this.props
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
            <Text style={styles.sectionHeaderText}>{t('transaction.operation')}</Text>
            <Text style={styles.bodyText}>{t('signTX')}</Text>
            <Text style={styles.sectionHeaderText}>{t('transaction.data')}</Text>
            <TouchableOpacity onPress={this.showDetails}>
              <Text style={styles.bodyText}>{t('details')}</Text>
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

export default connect<null, DispatchProps>(
  null,
  mapDispatchToProps
)(withNamespaces(Namespaces.dappkit)(DappKitSignTxScreen))
