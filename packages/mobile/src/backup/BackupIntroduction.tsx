import Button from '@celo/react-components/components/Button.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import { default as colors, default as colorsV2 } from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Sizes } from '@celo/react-components/styles/styles.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import DelayButton from 'src/backup/DelayButton'
import { useAccountKey } from 'src/backup/utils'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo.v2'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateProtected } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  backupCompleted: boolean
}

interface DispatchProps {
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

class BackupIntroduction extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerRight: <DelayButton />,
  })

  componentDidMount() {
    this.props.enterBackupFlow()
  }

  componentWillUnmount() {
    this.props.exitBackupFlow()
  }

  onPressBackup = () => {
    CeloAnalytics.track(CustomEventNames.set_backup_phrase)
    navigateProtected(Screens.BackupPhrase)
  }

  render() {
    const { backupCompleted } = this.props
    return (
      <SafeAreaView style={styles.container}>
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
      <Button text={t('introPrimaryAction')} onPress={onPrimaryPress} />
    </ScrollView>
  )
}

function AccountKeyPostSetup() {
  const accountKey = useAccountKey()

  const { t } = useTranslation(Namespaces.backupKeyFlow6)

  return (
    <ScrollView contentContainerStyle={styles.postSetupContainer}>
      <View>
        <Text style={fontStyles.h2}>{t('introTitle')}</Text>
        <View style={styles.keyArea}>
          <Text style={fontStyles.large}>{accountKey}</Text>
        </View>
        <Text style={styles.postSetupBody}>{t('postSetupBody')}</Text>
      </View>
      <View style={styles.postSetupCTA}>
        <TextButton>{t('postSetupCTA')}</TextButton>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: Sizes.THICK,
    justifyContent: 'center',
  },
  postSetupContainer: {
    flex: 1,
    paddingTop: Sizes.THICK,
    paddingHorizontal: Sizes.REG,
  },
  h1: {
    ...fontStyles.h1,
    paddingBottom: Sizes.REG,
    paddingTop: Sizes.REG,
  },
  body: {
    ...fontStyles.large,
    paddingBottom: Sizes.REG,
  },
  keyArea: {
    padding: Sizes.REG,
    backgroundColor: colorsV2.brownFaint,
    marginTop: Sizes.REG,
  },
  postSetupBody: {
    ...fontStyles.regular,
    marginVertical: Sizes.REG,
  },
  postSetupCTA: {
    alignSelf: 'center',
    paddingVertical: Sizes.THICK,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
    enterBackupFlow,
    exitBackupFlow,
  })(BackupIntroduction)
)
