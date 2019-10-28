import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import { backupIcon } from 'src/images/Images'
import { importBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
}

interface StateProps {
  isImportingWallet: boolean
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isImportingWallet: state.imports.isImportingWallet,
  }
}

export class ImportWalletEmpty extends React.Component<Props> {
  static navigationOptions = nuxNavigationOptions

  getBackupPhraseFromNavProps(): string {
    const backupPhrase = this.props.navigation.getParam('backupPhrase', '')
    if (!backupPhrase) {
      throw new Error('Mnemonic missing form nav props')
    }
    return backupPhrase
  }

  onPressUseEmpty = () => {
    this.props.importBackupPhrase(this.getBackupPhraseFromNavProps(), true)
  }

  onPressTryAnotherKey = () => {
    navigateBack()
  }

  render() {
    const { t, isImportingWallet } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWarningContainer}>
          <Image source={backupIcon} style={styles.logo} />
          <Text style={fontStyles.h1}>{getMoneyDisplayValue(0)}</Text>
          <Text style={fontStyles.bodyLarge}>{t('emptyWalletWarning')}</Text>
          <Text style={fontStyles.bodyLarge}>{t('useEmptyAnyway')}</Text>
        </View>

        {isImportingWallet && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}

        <GethAwareButton
          disabled={isImportingWallet}
          onPress={this.onPressUseEmpty}
          text={t('useEmptyWallet')}
          standard={false}
          type={BtnTypes.PRIMARY}
          testID="UseEmptyWalletButton"
        />
        <Button
          onPress={this.onPressTryAnotherKey}
          text={t('tryAnotherKey')}
          standard={false}
          type={BtnTypes.SECONDARY}
          testID="TryAnotherKeyButton"
        />
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
  logo: {
    marginBottom: 20,
    alignSelf: 'center',
    height: 75,
    width: 75,
  },
  emptyWarningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    importBackupPhrase,
  }
)(withNamespaces(Namespaces.nuxRestoreWallet3)(ImportWalletEmpty))
