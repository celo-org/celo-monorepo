import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { useDispatch, useSelector } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import i18n, { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import {
  cancelImportContacts,
  denyImportContacts,
  importContacts,
  setHasSeenVerificationNux,
} from 'src/identity/actions'
import { importContactsProgressSelector, matchedContactsSelector } from 'src/identity/reducer'
import { ImportContactsStatus } from 'src/identity/types'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import { requestContactsPermission } from 'src/utils/permissions'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'

type ScreenProps = StackScreenProps<StackParamList, Screens.ImportContacts>
type Props = ScreenProps

function ImportContactsScreen({ route, navigation }: Props) {
  const [isFindMeSwitchChecked, setFindMeSwitch] = useState(true)
  const { t } = useTranslation(Namespaces.onboarding)
  const importContactsProgress = useSelector(importContactsProgressSelector)
  const importStatus = importContactsProgress.status
  const prevImportContactProgressRef = React.useRef(importContactsProgress)
  const totalContactCount = importContactsProgress.total
  const matchedContacts = useSelector(matchedContactsSelector)
  const matchedContactsCount = Object.keys(matchedContacts).length
  const dispatch = useDispatch()
  const isSkipHidden = importStatus === ImportContactsStatus.Done
  const showSkipDialog =
    (route.params?.showSkipDialog || false) &&
    (importStatus === ImportContactsStatus.Failed || importStatus === ImportContactsStatus.Stopped)

  async function onPressConnect() {
    CeloAnalytics.track(CustomEventNames.import_contacts)
    const hasGivenContactPermission = await requestContactsPermission()
    if (hasGivenContactPermission) {
      dispatch(importContacts(isFindMeSwitchChecked))
    }
  }

  function onPressSkip() {
    CeloAnalytics.track(CustomEventNames.import_contacts_skip)
    dispatch(cancelImportContacts())
    dispatch(denyImportContacts())
    onFinish()
  }

  function onPressSkipCancel() {
    navigation.setParams({ showSkipDialog: false })
  }

  function onPressSkipConfirm() {
    dispatch(setHasSeenVerificationNux(true))
    navigateHome()
  }

  function onFinish() {
    navigate(Screens.OnboardingSuccessScreen)
  }

  function onToggleFindMeSwitch(value: boolean) {
    setFindMeSwitch(value)
  }

  function renderImportStatus() {
    if (importStatus === ImportContactsStatus.Done) {
      return (
        <View style={styles.statusContainer}>
          <Checkmark />
          {matchedContactsCount > 0 ? (
            <>
              <Text style={styles.h1Status}>
                {t('contacts.syncing.successHeader', { matches: matchedContactsCount })}
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
    if (importStatus === ImportContactsStatus.Processing) {
      h2Text = 'contacts.syncing.loadingStatus1'
    } else if (importStatus === ImportContactsStatus.Matchmaking) {
      h2Text = 'contacts.syncing.loadingStatus2'
    } else {
      h2Text = 'contacts.syncing.loadingStatus0'
    }
    return (
      <View style={styles.statusContainer}>
        <LoadingSpinner />
        <Text style={styles.h1Status}>{t('contacts.syncing.loadingHeader')}</Text>
        <Text style={styles.h2Status}>{t(h2Text, { total: totalContactCount })}</Text>
      </View>
    )
  }

  // If import has already been done, move user forward
  // Eventually we will want to allow users to prompt matchmaking
  React.useEffect(() => {
    if (importStatus === ImportContactsStatus.Done) {
      const onFinishTimeout = setTimeout(onFinish, 2000)
      return () => {
        clearTimeout(onFinishTimeout)
      }
    }
  }, [])

  React.useEffect(() => {
    const prevImportContactProgress = prevImportContactProgressRef.current
    const prevImportStatus = prevImportContactProgress?.status
    prevImportContactProgressRef.current = importContactsProgress

    if (
      prevImportStatus !== ImportContactsStatus.Done &&
      importStatus === ImportContactsStatus.Done
    ) {
      const onFinishTimeout = setTimeout(onFinish, 1500)
      return () => {
        clearTimeout(onFinishTimeout)
      }
    }
  }, [importContactsProgress])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {importStatus <= ImportContactsStatus.Stopped && (
          <>
            <Text style={styles.h1} testID="ImportContactsScreenHeader">
              {t('contacts.header')}
            </Text>
            <Text style={styles.body}>{t('contacts.body')}</Text>
            <View style={styles.switchContainer}>
              <Switch value={isFindMeSwitchChecked} onValueChange={onToggleFindMeSwitch} />
              <Text style={styles.switchText}>{t('contacts.findSwitch')}</Text>
            </View>
            <Button
              onPress={onPressConnect}
              text={t('global:connect')}
              size={BtnSizes.MEDIUM}
              type={BtnTypes.SECONDARY}
            />
          </>
        )}
        {importStatus > ImportContactsStatus.Stopped && renderImportStatus()}
      </ScrollView>
      <View style={[styles.bottomButtonContainer, isSkipHidden && styles.invisible]}>
        <TextButton
          disabled={isSkipHidden}
          onPress={onPressSkip}
          style={styles.bottomButtonText}
          testID="ImportContactsScreenSkipButton"
        >
          {t('global:skip')}
        </TextButton>
      </View>
      <VerificationSkipDialog
        isVisible={showSkipDialog}
        onPressCancel={onPressSkipCancel}
        onPressConfirm={onPressSkipConfirm}
      />
    </SafeAreaView>
  )
}

ImportContactsScreen.navigationOptions = ({ navigation }: ScreenProps) => ({
  ...nuxNavigationOptions,
  headerTitle: () => (
    <HeaderTitleWithSubtitle
      title={i18n.t('onboarding:verificationEducation.title')}
      subTitle={i18n.t('onboarding:step', { step: '5' })}
    />
  ),
  headerRight: () => (
    <TopBarTextButton
      title={i18n.t('global:skip')}
      testID="VerificationEducationSkip"
      // tslint:disable-next-line: jsx-no-lambda
      onPress={() => navigation.setParams({ showSkipDialog: true })}
      titleStyle={{ color: colors.goldDark }}
    />
  ),
})

export default ImportContactsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
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
    color: colors.greenBrand,
  },
  h2Status: {
    ...fontStyles.h2,
    color: colors.greenFaint,
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
    color: colors.gray5,
  },
  statusContainer: {
    alignItems: 'center',
  },
  invisible: {
    opacity: 0,
  },
})

// export default connect<StateProps, DispatchProps, {}, RootState>(
//   mapStateToProps,
//   mapDispatchToProps
// )(withTranslation<Props>(Namespaces.onboarding)(ImportContactsScreen))
