import Button from '@celo/react-components/components/Button'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { useAccountKey } from 'src/backup/utils'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  backupCompleted: boolean
}

type NavigationProps = StackScreenProps<StackParamList, Screens.BackupIntroduction>

type Props = StateProps & NavigationProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

class BackupIntroduction extends React.Component<Props> {
  onPressBackup = () => {
    ValoraAnalytics.track(OnboardingEvents.backup_start)
    navigate(Screens.AccountKeyEducation)
  }

  render() {
    const { backupCompleted, route } = this.props
    const navigatedFromSettings = route.params?.navigatedFromSettings
    return (
      <SafeAreaView style={styles.container}>
        {!navigatedFromSettings && <DrawerTopBar />}
        {backupCompleted ? (
          <AccountKeyPostSetup />
        ) : (
          <AccountKeyIntro onPrimaryPress={this.onPressBackup} />
        )}
      </SafeAreaView>
    )
  }
}

interface AccountKeyStartProps {
  onPrimaryPress: () => void
}

function AccountKeyIntro({ onPrimaryPress }: AccountKeyStartProps) {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  return (
    <ScrollView contentContainerStyle={styles.introContainer}>
      <Logo height={32} />
      <Text style={styles.h1}>{t('introTitle')}</Text>
      <Text style={styles.body}>{t('introBody')}</Text>
      <Button text={t('introPrimaryAction')} onPress={onPrimaryPress} testID="SetUpAccountKey" />
    </ScrollView>
  )
}

function AccountKeyPostSetup() {
  const accountKey = useAccountKey()

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  return (
    <ScrollView contentContainerStyle={styles.postSetupContainer}>
      <View>
        <Text style={fontStyles.h2}>{t('postSetupTitle')}</Text>
        <View style={styles.keyArea}>
          <Text style={fontStyles.large}>{accountKey}</Text>
        </View>
        <Text style={styles.postSetupBody}>{t('postSetupBody')}</Text>
      </View>
      <View style={styles.postSetupCTA}>
        <TextButton onPress={goToAccountKeyGuide}>{t('postSetupCTA')}</TextButton>
      </View>
    </ScrollView>
  )
}

function goToAccountKeyGuide() {
  navigate(Screens.AccountKeyEducation, { nextScreen: Screens.BackupIntroduction })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: Spacing.Thick24,
    justifyContent: 'center',
  },
  postSetupContainer: {
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  h1: {
    ...fontStyles.h1,
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Regular16,
  },
  body: {
    ...fontStyles.large,
    paddingBottom: Spacing.Regular16,
  },
  keyArea: {
    padding: Spacing.Regular16,
    backgroundColor: colors.beige,
    marginTop: Spacing.Regular16,
  },
  postSetupBody: {
    ...fontStyles.regular,
    marginVertical: Spacing.Regular16,
  },
  postSetupCTA: {
    alignSelf: 'center',
    paddingVertical: Spacing.Regular16,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(BackupIntroduction)
