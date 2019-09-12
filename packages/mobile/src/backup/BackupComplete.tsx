import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setBackupCompleted, setSocialBackupCompleted } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
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

  onDone = () => {
    // This screen should be reachable when regular backup is already completed
    this.props.setBackupCompleted()
    this.props.setSocialBackupCompleted()

    CeloAnalytics.track(CustomEventNames.question_done)

    navigate(Screens.Account)
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <View style={styles.questionTextContainer}>
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>{t('bothBackupsDone.0')}</Text>
          <Text style={fontStyles.body}>{t('bothBackupsDone.1')}</Text>
        </View>
        <Button onPress={this.onDone} text={t('done')} standard={true} type={BtnTypes.PRIMARY} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    flexDirection: 'column',
    paddingHorizontal: 20,
  },
  questionTextContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  h1: {
    color: colors.dark,
    paddingTop: 25,
  },
  copyToClipboardButton: {
    marginTop: 50,
    alignSelf: 'center',
    fontSize: 14,
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
