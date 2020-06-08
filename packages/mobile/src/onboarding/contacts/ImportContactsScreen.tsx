import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces, withTranslation } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { cancelImportContacts, denyImportContacts, importContacts } from 'src/identity/actions'
import { ImportContactProgress } from 'src/identity/reducer'
import { ContactMatches, ImportContactsStatus } from 'src/identity/types'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { requestContactsPermission } from 'src/utils/permissions'

interface StateProps {
  importContactsProgress: ImportContactProgress
  matchedContacts: ContactMatches
}

interface DispatchProps {
  importContacts: typeof importContacts
  cancelImportContacts: typeof cancelImportContacts
  denyImportContacts: typeof denyImportContacts
}

type Props = StateProps & DispatchProps & WithTranslation

interface State {
  isFindMeSwitchChecked: boolean
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    importContactsProgress: state.identity.importContactsProgress,
    matchedContacts: state.identity.matchedContacts,
  }
}

const mapDispatchToProps = {
  importContacts,
  cancelImportContacts,
  denyImportContacts,
}

class ImportContactScreen extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    isFindMeSwitchChecked: true,
  }

  onFinishTimeout: number | null = null

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.importContactsProgress.status !== ImportContactsStatus.Done &&
      this.props.importContactsProgress.status === ImportContactsStatus.Done
    ) {
      // Set timeout to leave checkmark in place for a little while
      // @ts-ignore setTimeout is incorrectly picking up the Node typings instead of RN's typings
      this.onFinishTimeout = setTimeout(this.onFinish, 1500)
    }
  }

  componentWillUnmount() {
    if (this.onFinishTimeout) {
      clearTimeout(this.onFinishTimeout)
    }
  }

  onPressConnect = async () => {
    CeloAnalytics.track(CustomEventNames.import_contacts)
    const hasGivenContactPermission = await requestContactsPermission()
    if (hasGivenContactPermission) {
      this.props.importContacts(this.state.isFindMeSwitchChecked)
    }
  }

  onPressSkip = () => {
    this.props.cancelImportContacts()
    // TODO strictly speaking we should set up a separate action/reducer/state to track if
    // this screen has been seen before but since nothing else uses denyImport atm, using that
    // for convinience
    this.props.denyImportContacts()
    CeloAnalytics.track(CustomEventNames.import_contacts_skip)
    this.onFinish()
  }

  onToggleFindMeSwitch = (value: boolean) => {
    this.setState({
      isFindMeSwitchChecked: value,
    })
  }

  onFinish = () => {
    navigate(Screens.OnboardingSuccessScreen)
  }

  renderImportStatus = () => {
    const {
      t,
      importContactsProgress: { status, total },
      matchedContacts,
    } = this.props
    const matchesFound = Object.keys(matchedContacts).length

    if (status === ImportContactsStatus.Done) {
      return (
        <View style={styles.statusContainer}>
          <Checkmark />
          {matchesFound > 0 ? (
            <>
              <Text style={styles.h1Status}>
                {t('contacts.syncing.successHeader', { matches: matchesFound })}
              </Text>
              <Text style={styles.h2Status}>{t('contacts.syncing.successStatus')}</Text>
            </>
          ) : (
            <Text style={styles.h1Status}>{t('contacts.syncing.successStatus')}</Text>
          )}
        </View>
      )
    }

    let h2Text: string
    if (status === ImportContactsStatus.Processing) {
      h2Text = 'contacts.syncing.loadingStatus1'
    } else if (status === ImportContactsStatus.Matchmaking) {
      h2Text = 'contacts.syncing.loadingStatus2'
    } else {
      h2Text = 'contacts.syncing.loadingStatus0'
    }
    return (
      <View style={styles.statusContainer}>
        <LoadingSpinner />
        <Text style={styles.h1Status}>{t('contacts.syncing.loadingHeader')}</Text>
        <Text style={styles.h2Status}>{t(h2Text, { total })}</Text>
      </View>
    )
  }

  render() {
    const { isFindMeSwitchChecked } = this.state
    const {
      t,
      importContactsProgress: { status },
    } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {status <= ImportContactsStatus.Stopped && (
            <>
              <Text style={styles.h1} testID="ImportContactsScreenHeader">
                {t('contacts.header')}
              </Text>
              <Text style={styles.body}>{t('contacts.body')}</Text>
              <View style={styles.switchContainer}>
                <Switch value={isFindMeSwitchChecked} onValueChange={this.onToggleFindMeSwitch} />
                <Text style={styles.switchText}>{t('contacts.findSwitch')}</Text>
              </View>
              <Button
                onPress={this.onPressConnect}
                text={t('global:connect')}
                size={BtnSizes.MEDIUM}
                type={BtnTypes.SECONDARY}
              />
            </>
          )}
          {status > ImportContactsStatus.Stopped && this.renderImportStatus()}
        </ScrollView>
        <View style={styles.bottomButtonContainer}>
          <TextButton
            onPress={this.onPressSkip}
            style={styles.bottomButtonText}
            testID="ImportContactsScreenSkipButton"
          >
            {t('global:skip')}
          </TextButton>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colorsV2.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    justifyContent: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
    textAlign: 'left',
  },
  h1Status: {
    ...fontStyles.h1,
    marginTop: 20,
    paddingBottom: 10,
    color: colorsV2.greenBrand,
  },
  h2Status: {
    ...fontStyles.h2,
    color: colorsV2.greenFaint,
  },
  body: {
    ...fontStyles.bodyLarge,
  },
  switchContainer: {
    marginVertical: 20,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  switchText: {
    ...fontStyles.bodyLarge,
    paddingTop: 2,
    paddingLeft: 8,
  },
  bottomButtonContainer: {
    margin: 30,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: colorsV2.gray5,
  },
  statusContainer: {
    alignItems: 'center',
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.onboarding)(ImportContactScreen))
