import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import i18n, { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { cancelImportContacts, denyImportContacts, importContacts } from 'src/identity/actions'
import { importContactsProgressSelector, matchedContactsSelector } from 'src/identity/reducer'
import { ImportContactsStatus } from 'src/identity/types'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { requestContactsPermission } from 'src/utils/permissions'

type ScreenProps = StackScreenProps<StackParamList, Screens.ImportContacts>
type Props = ScreenProps

function ImportContactsScreen({ route, navigation }: Props) {
  const [isFindMeSwitchChecked, setFindMeSwitch] = useState(true)
  const { t } = useTranslation(Namespaces.onboarding)
  const importContactsProgress = useSelector(importContactsProgressSelector)
  const importStatus = importContactsProgress.status
  const totalContacts = importContactsProgress.total
  const prevImportContactProgressRef = React.useRef(importContactsProgress)
  const matchedContacts = useSelector(matchedContactsSelector)
  const matchedContactsCount = Object.keys(matchedContacts).length
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  const renderStatusContainer = () => {
    if (importStatus === ImportContactsStatus.Done) {
      return (
        <View style={styles.statusContainer}>
          <Checkmark />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>{t('contacts.syncing.successHeader')}</Text>
            {matchedContactsCount > 0 ? (
              <Text style={styles.subStatusText}>
                {t('contacts.syncing.successWithMatches', { matches: matchedContactsCount })}
              </Text>
            ) : (
              <Text style={styles.subStatusText}>
                {t('contacts.syncing.successWithoutMatches')}
              </Text>
            )}
          </View>
        </View>
      )
    }

    let subHeaderText
    if (importStatus === ImportContactsStatus.Processing) {
      subHeaderText = t('contacts.syncing.loadingStatus1', { total: totalContacts })
    } else if (importStatus === ImportContactsStatus.Matchmaking) {
      subHeaderText = t('contacts.syncing.loadingStatus2')
    } else {
      subHeaderText = t('contacts.syncing.loadingStatus0')
    }

    return (
      <View style={styles.statusContainer}>
        <LoadingSpinner />
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusText}>{t('contacts.syncing.loadingHeader')}</Text>
          <Text style={styles.subStatusText}>{subHeaderText}</Text>
        </View>
      </View>
    )
  }

  const onFinish = () => {
    navigate(Screens.OnboardingSuccessScreen)
  }

  const onPressConnect = async () => {
    ValoraAnalytics.track(IdentityEvents.contacts_connect, {
      matchMakingEnabled: isFindMeSwitchChecked,
    })
    await requestContactsPermission()
    dispatch(importContacts(isFindMeSwitchChecked))
  }

  const onToggleFindMeSwitch = (value: boolean) => {
    setFindMeSwitch(value)
  }

  const onPressSkip = () => {
    dispatch(denyImportContacts())
    dispatch(cancelImportContacts())
    navigate(Screens.OnboardingSuccessScreen)
  }

  React.useEffect(() => {
    navigation.setParams({ onPressSkip })
  }, [])

  React.useEffect(() => {
    navigation.setParams({ importStatus })
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
      >
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
        {importStatus > ImportContactsStatus.Stopped && renderStatusContainer()}
      </ScrollView>
    </View>
  )
}

ImportContactsScreen.navigationOptions = ({ route }: ScreenProps) => {
  const onPressSkip = route.params?.onPressSkip ? route.params.onPressSkip : () => null
  const importDone = route.params?.importStatus === ImportContactsStatus.Done
  return {
    ...nuxNavigationOptionsNoBackButton,
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={i18n.t('onboarding:verificationEducation.title')}
        subTitle={i18n.t('onboarding:step', { step: '5' })}
      />
    ),
    headerRight: !importDone
      ? () => (
          <TopBarTextButtonOnboarding
            title={i18n.t('global:skip')}
            testID="ImportContactsSkip"
            onPress={onPressSkip}
          />
        )
      : () => null,
  }
}

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
    paddingTop: 8,
    paddingBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 32,
  },
  statusTextContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  statusText: {
    ...fontStyles.regular600,
    color: colors.onboardingBrownLight,
  },
  subStatusText: {
    ...fontStyles.small,
    paddingTop: 2,
    color: colors.onboardingBrownLight,
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
