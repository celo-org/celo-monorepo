import Button from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DelayButton from 'src/backup/DelayButton'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { emptyHeader } from 'src/navigator/Headers'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'

const TAG = 'BackupForceScreen'

type Props = StackScreenProps<StackParamList, Screens.BackupForceScreen>

function BackupForceScreen({ navigation }: Props) {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  const dispatch = useDispatch()

  const startBackup = () => {
    ValoraAnalytics.track(OnboardingEvents.backup_start)
    ensurePincode()
      .then((pinIsCorrect) => {
        if (pinIsCorrect) {
          navigate(Screens.AccountKeyEducation)
        }
      })
      .catch((error) => {
        Logger.error(`${TAG}@onPress`, 'PIN ensure error', error)
      })
  }

  const skipBackup = () => {
    dispatch(setBackupCompleted())
    navigate(Screens.WalletHome)
  }

  // Prevent back button on Android
  useEffect(() => {
    const backPressListener = () => true
    BackHandler.addEventListener('hardwareBackPress', backPressListener)
    return () => BackHandler.removeEventListener('hardwareBackPress', backPressListener)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton onSkip={skipBackup} />
      <ScrollView contentContainerStyle={styles.content}>
        <Logo height={32} />
        <Text style={styles.title}>{t('backupSetupTitle')}</Text>
        <Text style={styles.body}>{t('backupSetupBody')}</Text>
        <Button text={t('introPrimaryAction')} onPress={startBackup} testID="SetUpAccountKey" />
      </ScrollView>
    </SafeAreaView>
  )
}

BackupForceScreen.navOptions = {
  ...emptyHeader,
  // Prevent swiping back on iOS
  gestureEnabled: false,
  headerLeft: () => null,
  headerRight: () => <DelayButton />,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  title: {
    ...fontStyles.h2,
    paddingBottom: variables.contentPadding,
    paddingTop: variables.contentPadding,
  },
  body: {
    ...fontStyles.regular,
    paddingBottom: 24,
    textAlign: 'center',
  },
})

export default BackupForceScreen
