import Button, { BtnTypes } from '@celo/react-components/components/Button'
import SmallButton from '@celo/react-components/components/SmallButton'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setBackupCompleted, setSocialBackupCompleted } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { BackupPhraseContainer } from 'src/backup/BackupPhraseContainer'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  setSocialBackupCompleted: typeof setSocialBackupCompleted
}

type Props = DispatchProps & WithNamespaces

class BackupComplete extends React.Component<Props> {
  static navigationOptions = () => ({
    ...nuxNavigationOptionsNoBackButton,
  })

  onBackButtonPressAndroid = () => {
    // Override back button to not go back to BackupVerify screen
    navigate(Screens.Account)

    return true
  }

  onDone = () => {
    // This screen is only reachable when regular backup is already completed
    this.props.setSocialBackupCompleted()

    CeloAnalytics.track(CustomEventNames.question_done)

    navigate(Screens.Account)
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        {/* <View style={styles.textContainer}>
          <View>
            <Image source={shinyGold} style={styles.logo} />
          </View>
          <Text style={[fontStyles.h1, styles.h1]}>{t('bothBackupsDone.0')}</Text>
          <Text style={fontStyles.body}>{t('bothBackupsDone.1')}</Text>
        </View>
        <Button onPress={this.onDone} text={t('done')} standard={false} type={BtnTypes.PRIMARY} /> */}
        <ScrollView
          style={styles.questionTextContainer}
          contentContainerStyle={styles.scrollContainer}
        >
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>
            {t(backupCompleted ? 'backupKey' : 'backupKeySet')}
          </Text>
          <Text style={fontStyles.body}>{t('dontLoseIt')}</Text>
          {backupCompleted && <BackupPhraseContainer words={mnemonic} />}
          <SmallButton
            text={t('copyToClipboard')}
            testID={'pasteMessageButton'}
            onPress={this.copyToClipboard}
            solid={false}
            style={styles.copyToClipboardButton}
          />
        </ScrollView>
        <Button onPress={this.onDone} text={t('done')} standard={true} type={BtnTypes.PRIMARY} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingBottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    paddingHorizontal: 20,
  },
  logo: {
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    // https://medium.com/@peterpme/taming-react-natives-scrollview-with-flex-144e6ff76c08
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
    width: 75,
    height: 75,
    marginBottom: 20,
  },
  questionTextContainer: {
    flex: 1,
  },
  h1: {
    color: colors.dark,
    paddingTop: 25,
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps, {}, RootState>(
    null,
    {
      setBackupCompleted,
      setSocialBackupCompleted,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupComplete))
)
