import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exitBackupFlow, navigatePinProtected } from 'src/app/actions'
import { Namespaces, withTranslation } from 'src/i18n'
import backupIcon from 'src/images/backup-icon.png'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  doingPinVerification: boolean
}

interface DispatchProps {
  exitBackupFlow: typeof exitBackupFlow
  navigatePinProtected: typeof navigatePinProtected
}

interface NavigationProps {
  incomingFromBackupFlow: boolean
}

type Props = WithTranslation & StateProps & DispatchProps & NavigationInjectedProps<NavigationProps>

const mapStateToProps = (state: RootState): StateProps => {
  return {
    doingPinVerification: state.app.doingPinVerification,
  }
}

class BackupSocialIntro extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  isIncomingFromBackupFlow = () => {
    return this.props.navigation.getParam('incomingFromBackupFlow', false)
  }

  onPressContinue = () => {
    const navigateMethod = this.isIncomingFromBackupFlow()
      ? navigate
      : this.props.navigatePinProtected
    navigateMethod(Screens.BackupSocial)
  }

  onPressSkip = () => {
    CeloAnalytics.track(CustomEventNames.skip_social_backup)
    this.props.exitBackupFlow()
    navigateHome()
  }

  render() {
    const { t, doingPinVerification } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Image source={backupIcon} style={styles.logo} />
          <Text style={styles.h1}>{t('socialBackupIntro.header')}</Text>
          <Text style={styles.body}>{t('socialBackupIntro.body')}</Text>
          <Text style={[styles.body, fontStyles.bold]}>{t('socialBackupIntro.warning')}</Text>
        </ScrollView>
        {doingPinVerification && (
          <ActivityIndicator size="large" color={colors.celoGreen} style={styles.loader} />
        )}
        <>
          <Button
            onPress={this.onPressContinue}
            text={t('setUpSocialBackup')}
            standard={false}
            type={BtnTypes.PRIMARY}
          />
          {this.isIncomingFromBackupFlow() && (
            <Button
              onPress={this.onPressSkip}
              text={t('socialBackupIntro.skip')}
              standard={false}
              type={BtnTypes.SECONDARY}
            />
          )}
        </>
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
    paddingHorizontal: 30,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    height: 75,
    width: 75,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 15,
  },
  body: {
    ...fontStyles.body,
    textAlign: 'center',
    paddingBottom: 15,
  },
  loader: {
    marginBottom: 20,
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps, {}, RootState>(mapStateToProps, {
    exitBackupFlow,
    navigatePinProtected,
  })(withTranslation(Namespaces.backupKeyFlow6)(BackupSocialIntro))
)
