import ContactCircle from '@celo/react-components/components/ContactCircle'
import SettingsItem from '@celo/react-components/components/SettingsItem'
import { navigate } from '@celo/react-components/services/NavigationService'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { Trans, WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import BackButton from 'src/shared/BackButton'

function goToEditInfoScreen() {
  CeloAnalytics.track(CustomEventNames.edit_profile)
  navigate(Screens.SetupAccount, { isNUXMode: false })
}

function goToEditLanguageScreen() {
  CeloAnalytics.track(CustomEventNames.edit_language)
  navigate(Screens.Language, { nextScreen: Screens.Settings })
}

interface StateProps {
  name: string
  e164Number: string
  accountAddress: string
}

const mapStateToProps = (state: RootState) => ({
  name: state.app.name,
  e164Number: state.app.e164Number,
  accountAddress: state.app.accountAddress,
})

type Props = StateProps & WithNamespaces

class SettingsScreen extends React.Component<Props, {}> {
  render() {
    const { t, name, e164Number, accountAddress } = this.props

    return (
      <View style={styles.container}>
        <View style={styles.nav}>
          <BackButton />
        </View>
        <View style={styles.avatar}>
          <ContactCircle size={55} name={name} address={accountAddress} />
        </View>
        <View style={styles.selections}>
          <SettingsItem onPress={goToEditInfoScreen}>
            <Text style={fontStyles.bodySecondary}>
              <Trans i18nKey="depositToNumber">
                <Text style={fontStyles.body}>{{ number: e164Number }}</Text>
              </Trans>
            </Text>
          </SettingsItem>
          <SettingsItem onPress={goToEditLanguageScreen} title={t('chooseLanguage')} />
        </View>

        <View style={styles.footer}>
          {DeviceInfo.getVersion() && (
            <Text style={fontStyles.bodySmall}>{t('version') + ' ' + DeviceInfo.getVersion()}</Text>
          )}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    marginBottom: 30,
  },
  nav: {
    paddingTop: 15,
    paddingLeft: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  selections: {
    borderTopWidth: 1,
    borderColor: colors.darkLightest,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingBottom: 10,
  },
})

export default withNamespaces(Namespaces.setupAccount)(connect(mapStateToProps)(SettingsScreen))
