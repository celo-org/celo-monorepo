import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { getStoredMnemonic, splitMnemonic } from 'src/backup/utils'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface State {
  mnemonic: string
}

interface StateProps {
  language: string | null
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
}

interface OwnProps {
  // Must be 0 index!
  partNumber: number
}

type Props = OwnProps & WithNamespaces & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
  }
}

class BackupSocial extends React.Component<Props, State> {
  static navigationOptions = { header: null }
  state = {
    mnemonic: '',
  }

  partScreens = [Screens.BackupSocialFirst, Screens.BackupSocialSecond, Screens.BackupComplete]

  componentDidMount() {
    FlagSecure.activate()
    this.retrieveMnemonic()
  }

  componentWillUnmount() {
    FlagSecure.deactivate()
    this.props.hideAlert()
  }

  retrieveMnemonic = async () => {
    if (this.state.mnemonic) {
      return
    }

    try {
      const mnemonic = await getStoredMnemonic()
      if (!mnemonic) {
        throw new Error('Mnemonic not stored in key store')
      }
      this.setState({ mnemonic })
    } catch (e) {
      Logger.error('backup/retrieveMnemonic', e)
      this.props.showError(ErrorMessages.FAILED_FETCH_MNEMONIC)
    }
  }

  continueBackup = () => {
    CeloAnalytics.track(CustomEventNames.backup_continue)
    let { partNumber } = this.props
    partNumber++

    if (partNumber >= this.partScreens.length) {
      throw new Error(`Invalid Social Backup part screen ${partNumber}`)
    }

    navigate(this.partScreens[partNumber])
  }

  render() {
    const { t, language, partNumber } = this.props
    const { mnemonic } = this.state
    const [firstHalf, secondHalf] = splitMnemonic(mnemonic, language)

    return (
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <View>
            <Text style={[fontStyles.h1, styles.title]}>{t('socialBackup')}</Text>
            {partNumber === 0 && (
              <>
                <Text style={styles.verifyText}>{t('socialBackupYourKey')}</Text>
                <Text style={styles.verifyText}>{t('easyToForget')}</Text>
                <BackupPhraseContainer label={t('sendFirstHalf')} words={firstHalf} />
              </>
            )}

            {partNumber === 1 && (
              <BackupPhraseContainer label={t('sendSecondHalf')} words={secondHalf} />
            )}
          </View>
          <View>
            <Button
              onPress={this.continueBackup}
              text={t('continue')}
              standard={true}
              type={BtnTypes.PRIMARY}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    marginVertical: 10,
    color: colors.dark,
  },
  verifyText: {
    ...fontStyles.bodySmall,
    fontSize: 15,
    textAlign: 'left',
    paddingTop: 15,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      showError,
      hideAlert,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupSocial))
)
