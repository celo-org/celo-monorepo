import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { setNumberVerified } from 'src/app/actions'
import { numberVerifiedSelector } from 'src/app/selectors'
import i18n, { Namespaces } from 'src/i18n'
import { fetchVerificationState, setHasSeenVerificationNux } from 'src/identity/actions'
import { verificationStateSelector } from 'src/identity/reducer'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import VerificationLearnMoreDialog from 'src/verify/VerificationLearnMoreDialog'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationEducationScreen>

type Props = ScreenProps

function VerificationEducationScreen({ route, navigation }: Props) {
  const showSkipDialog = route.params?.showSkipDialog || false
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const { t } = useTranslation(Namespaces.onboarding)
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const { isBalanceSufficient, isLoading, status, actionableAttestations } = useSelector(
    verificationStateSelector
  )
  const { numAttestationsRemaining } = status
  const numberVerified = useSelector(numberVerifiedSelector)
  const partOfOnboarding = !route.params?.hideOnboardingStep

  useEffect(() => {
    if (status.isVerified) {
      dispatch(setNumberVerified(true))
    }
  }, [status.isVerified])

  useEffect(() => {
    if (!partOfOnboarding) {
      dispatch(fetchVerificationState())
    }
  }, [])

  const onPressStart = (withoutRevealing: boolean) => {
    return () => {
      dispatch(setHasSeenVerificationNux(true))
      navigation.navigate(Screens.VerificationLoadingScreen, { withoutRevealing })
    }
  }

  const onPressSkipCancel = () => {
    navigation.setParams({ showSkipDialog: false })
  }

  const onPressSkipConfirm = () => {
    dispatch(setHasSeenVerificationNux(true))
    navigateHome()
  }

  const onPressContinue = () => {
    dispatch(setHasSeenVerificationNux(true))
    if (partOfOnboarding) {
      navigation.navigate(Screens.ImportContacts)
    } else {
      navigateHome()
    }
  }

  const onPressLearnMore = () => {
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  let bodyText
  let firstButton
  let secondButton

  if (numberVerified) {
    // Already verified
    bodyText = t('verificationEducation.bodyAlreadyVerified')
    firstButton = (
      <Button
        text={partOfOnboarding ? t('global:continue') : t('global:goBack')}
        onPress={onPressContinue}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        testID="VerificationEducationSkip"
      />
    )
  } else if (isBalanceSufficient) {
    // Sufficient balance
    bodyText = t('verificationEducation.body')
    firstButton = (
      <Button
        text={
          NUM_ATTESTATIONS_REQUIRED - numAttestationsRemaining + actionableAttestations.length
            ? t('verificationEducation.resume')
            : t('verificationEducation.start')
        }
        onPress={onPressStart(false)}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        testID="VerificationEducationContinue"
      />
    )
    if (actionableAttestations.length === numAttestationsRemaining) {
      secondButton = (
        <Button
          text={t('verificationEducation.receivedCodes')}
          onPress={onPressStart(true)}
          type={BtnTypes.ONBOARDING_SECONDARY}
          style={styles.startButton}
          testID="VerificationEducationAlready"
        />
      )
    }
  } else {
    // Insufficient balance
    bodyText = t('verificationEducation.bodyInsufficientBalance')
    firstButton = (
      <Button
        text={t('verificationEducation.skipForNow')}
        onPress={onPressSkipConfirm}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        testID="VerificationEducationSkip"
      />
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
      >
        <Text style={styles.header} testID="VerificationEducationHeader">
          {t('verificationEducation.header')}
        </Text>
        <Text style={styles.body}>{bodyText}</Text>
        {firstButton}
        {secondButton}
        <View style={styles.spacer} />
        <TextButton style={styles.doINeedToConfirmButton} onPress={onPressLearnMore}>
          {t('verificationEducation.doINeedToConfirm')}
        </TextButton>
      </ScrollView>
      <VerificationSkipDialog
        isVisible={showSkipDialog}
        onPressCancel={onPressSkipCancel}
        onPressConfirm={onPressSkipConfirm}
      />
      <VerificationLearnMoreDialog
        isVisible={showLearnMoreDialog}
        onPressDismiss={onPressLearnMoreDismiss}
      />
    </View>
  )
}

VerificationEducationScreen.navigationOptions = ({ navigation, route }: ScreenProps) => {
  const title = route.params?.hideOnboardingStep
    ? i18n.t('onboarding:verificationEducation.title')
    : () => (
        <HeaderTitleWithSubtitle
          title={i18n.t('onboarding:verificationEducation.title')}
          subTitle={i18n.t('onboarding:step', { step: '4' })}
        />
      )
  return {
    ...nuxNavigationOptions,
    headerTitle: title,
    headerRight: () =>
      !route.params?.hideOnboardingStep && (
        <TopBarTextButton
          title={i18n.t('global:skip')}
          testID="VerificationEducationSkip"
          // tslint:disable-next-line: jsx-no-lambda
          onPress={() => navigation.setParams({ showSkipDialog: true })}
          titleStyle={{ color: colors.goldDark }}
        />
      ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  startButton: {
    marginBottom: Spacing.Thick24,
  },
  spacer: {
    flex: 1,
  },
  doINeedToConfirmButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: Spacing.Regular16,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
})

export default VerificationEducationScreen
