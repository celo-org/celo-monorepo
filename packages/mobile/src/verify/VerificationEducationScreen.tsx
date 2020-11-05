import Button, { BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberInput from '@celo/react-components/components/PhoneNumberInput'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { Countries } from '@celo/utils/src/countries'
import { getE164DisplayNumber, getRegionCode } from '@celo/utils/src/phoneNumbers'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { setNumberVerified } from 'src/app/actions'
import { numberVerifiedSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import { RECAPTCHA_SITE_KEY, WEB_LINK } from 'src/config'
import { features } from 'src/flags'
import i18n, { Namespaces } from 'src/i18n'
import {
  fetchVerificationState,
  setHasSeenVerificationNux,
  startVerification,
} from 'src/identity/actions'
import { verificationStateSelector } from 'src/identity/reducer'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'
import GoogleReCaptcha from 'src/verify/safety/GoogleReCaptcha'
import { getSafetyNetAttestation } from 'src/verify/safety/SafetyNet'
import VerificationLearnMoreDialog from 'src/verify/VerificationLearnMoreDialog'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationEducationScreen>

type Props = ScreenProps

function VerificationEducationScreen({ route, navigation }: Props) {
  const showSkipDialog = route.params?.showSkipDialog || false
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const [isCaptchaVisible, setIsCaptchaVisible] = useState(false)
  const [, setSafetyNetAttestation] = useState()
  const e164PhoneNumber = useSelector(e164NumberSelector)
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

  const country = useMemo(() => {
    const regionCode = getRegionCode(e164PhoneNumber || '')
    const countries = new Countries(i18n.language)
    return countries.getCountryByCodeAlpha2(regionCode || '')
  }, [e164PhoneNumber, i18n.language])

  useEffect(() => {
    if (status.isVerified) {
      dispatch(setNumberVerified(true))
    }
  }, [status.isVerified])

  useFocusEffect(
    // useCallback is needed here: https://bit.ly/2G0WKTJ
    useCallback(() => {
      dispatch(fetchVerificationState())
    }, [])
  )

  const onStartVerification = () => {
    const withoutRevealing = actionableAttestations.length >= numAttestationsRemaining
    dispatch(setHasSeenVerificationNux(true))
    dispatch(startVerification(withoutRevealing))
  }

  const onPressStart = async () => {
    if (features.KOMENCI) {
      await showCaptcha()
    } else {
      onStartVerification()
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

  const showCaptcha = async () => {
    setIsCaptchaVisible(true)
    const safetyNetAttestationResponse = await getSafetyNetAttestation()
    Logger.info('SafetyNet attestation complete:', JSON.stringify(safetyNetAttestationResponse))
    setSafetyNetAttestation(safetyNetAttestationResponse)
  }
  const hideCaptcha = () => setIsCaptchaVisible(false)

  const handleCaptchaResolved = (res: any) => {
    hideCaptcha()
    const captchaCode = res?.nativeEvent?.data
    if (captchaCode !== 'cancel' && captchaCode !== 'error') {
      Logger.info('Captcha code received: ', captchaCode)
      // TODO: Add some brief loading indicator and send captcha somewhere before continuing.
      // Also, cache the session ID received.
      // TODO: Before calling this, make sure |safetyNetAttestation| has finished loading on Android.
      onStartVerification()
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <VerificationSkipDialog
          isVisible={showSkipDialog}
          onPressCancel={onPressSkipCancel}
          onPressConfirm={onPressSkipConfirm}
        />
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  let bodyText
  let firstButton

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
    bodyText = t(`verificationEducation.${features.KOMENCI ? 'feelessBody' : 'body'}`)
    firstButton = (
      <Button
        text={
          NUM_ATTESTATIONS_REQUIRED - numAttestationsRemaining + actionableAttestations.length
            ? t('verificationEducation.resume')
            : t('verificationEducation.start')
        }
        onPress={onPressStart}
        type={BtnTypes.ONBOARDING}
        style={styles.startButton}
        testID="VerificationEducationContinue"
      />
    )
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
        <PhoneNumberInput
          label={t('nuxNamePin1:phoneNumber')}
          style={styles.phoneNumber}
          country={country}
          nationalPhoneNumber={getE164DisplayNumber(e164PhoneNumber || '')}
          editable={false}
        />
        {firstButton}
        <View style={styles.spacer} />
        <TextButton style={styles.doINeedToConfirmButton} onPress={onPressLearnMore}>
          {t('verificationEducation.doINeedToConfirm')}
        </TextButton>
      </ScrollView>
      <Modal isVisible={isCaptchaVisible} style={styles.recaptchaModal}>
        <TopBarTextButton
          onPress={hideCaptcha}
          titleStyle={[
            {
              marginTop: insets.top,
              height: headerHeight - insets.top,
            },
            styles.recaptchaClose,
          ]}
          title={t('global:close')}
        />
        <GoogleReCaptcha
          siteKey={RECAPTCHA_SITE_KEY}
          url={WEB_LINK}
          languageCode={i18n.language}
          onMessage={handleCaptchaResolved}
          style={styles.recaptcha}
        />
      </Modal>
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
          testID="VerificationEducationSkipHeader"
          // tslint:disable-next-line: jsx-no-lambda
          onPress={() => navigation.setParams({ showSkipDialog: true })}
          titleStyle={{ color: colors.goldDark }}
        />
      ),
    headerLeft: () => route.params?.hideOnboardingStep && <BackButton />,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  recaptchaModal: {
    margin: 0,
    backgroundColor: 'rgba(249, 243, 240, 0.9)',
  },
  recaptchaClose: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    color: colors.dark,
  },
  recaptcha: {
    backgroundColor: 'transparent',
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
  phoneNumber: {
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
