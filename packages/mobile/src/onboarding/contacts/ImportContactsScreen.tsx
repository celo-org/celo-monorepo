import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
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
import { importContacts } from 'src/identity/actions'
import { importContactsProgressSelector, matchedContactsSelector } from 'src/identity/reducer'
import { ImportContactsStatus } from 'src/identity/types'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import { requestContactsPermission } from 'src/utils/permissions'

type ScreenProps = StackScreenProps<StackParamList, Screens.ImportContacts>
type Props = ScreenProps

function ImportContactsScreen({ route, navigation }: Props) {
  const [isFindMeSwitchChecked, setFindMeSwitch] = useState(true)
  const { t } = useTranslation(Namespaces.onboarding)
  const importContactsProgress = useSelector(importContactsProgressSelector)
  const importStatus = importContactsProgress.status
  const prevImportContactProgressRef = React.useRef(importContactsProgress)
  const matchedContacts = useSelector(matchedContactsSelector)
  const matchedContactsCount = Object.keys(matchedContacts).length
  const dispatch = useDispatch()

  async function onPressConnect() {
    CeloAnalytics.track(CustomEventNames.import_contacts)
    const hasGivenContactPermission = await requestContactsPermission()
    if (hasGivenContactPermission) {
      dispatch(importContacts(isFindMeSwitchChecked))
    }
  }

  function onFinish() {
    navigate(Screens.OnboardingSuccessScreen)
  }

  function onToggleFindMeSwitch(value: boolean) {
    setFindMeSwitch(value)
  }

  // If import has already been done, move user forward
  // Eventually we will want to somehow allow users to prompt matchmaking
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
    const prevImportStatus = prevImportContactProgress.status
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

  let statusComponents
  if (importStatus === ImportContactsStatus.Done) {
    statusComponents = (
      <>
        <Checkmark />
        {matchedContactsCount > 0 ? (
          <Text style={styles.statusText}>
            {t('contacts.syncing.successWithMatches', { matches: matchedContactsCount })}
          </Text>
        ) : (
          <Text style={styles.statusText}>{t('contacts.syncing.successWithoutMatches')}</Text>
        )}
      </>
    )
  } else {
    statusComponents = (
      <>
        <LoadingSpinner />
        <Text style={styles.statusText}>{t('contacts.syncing.loading')}</Text>
      </>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <Text style={styles.contactHeader} testID="ImportContactsScreenHeader">
            {t('contacts.header')}
          </Text>
          <Text style={styles.body}>{t('contacts.body')}</Text>
          {importStatus <= ImportContactsStatus.Stopped && (
            <>
              <View style={styles.switchContainer}>
                <Switch value={isFindMeSwitchChecked} onValueChange={onToggleFindMeSwitch} />
                <Text style={styles.switchText}>{t('contacts.findSwitch')}</Text>
              </View>
              <Button
                onPress={onPressConnect}
                text={t('global:connect')}
                size={BtnSizes.MEDIUM}
                type={BtnTypes.ONBOARDING}
              />
            </>
          )}
        </View>
        {importStatus > ImportContactsStatus.Stopped && (
          <View style={styles.statusContainer}>{statusComponents}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

ImportContactsScreen.navigationOptions = ({ navigation }: ScreenProps) => ({
  ...nuxNavigationOptionsNoBackButton,
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
      onPress={() => navigate(Screens.OnboardingSuccessScreen)}
      titleStyle={{ color: colors.goldDark }}
    />
  ),
})

export default ImportContactsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  contactHeader: {
    ...fontStyles.h2,
    textAlign: 'left',
    paddingTop: 48,
    paddingBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 32,
  },
  statusText: {
    ...fontStyles.regular500,
    color: colors.onboardingBrownLight,
    paddingLeft: 24,
  },
  body: {
    ...fontStyles.regular500,
  },
  switchContainer: {
    marginVertical: 20,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  switchText: {
    ...fontStyles.regular500,
    paddingLeft: 8,
  },
})
