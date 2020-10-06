import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import UpHandle from '@celo/react-components/icons/UpHandle'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
// Note: we're NOT using Animated from 'react-native-reanimated'
// because it currently has a glitch on Android and is 1 frame behind
// when swiping quickly
import { Animated, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import KeepAwake from 'react-native-keep-awake'
import { SafeAreaView, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import CancelButton from 'src/components/CancelButton'
import Carousel, { CarouselItem } from 'src/components/Carousel'
import { Namespaces } from 'src/i18n'
import { cancelVerification } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/types'
import {
  verificationEducation1,
  verificationEducation2,
  verificationEducation3,
  verificationEducation4,
} from 'src/images/Images'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import useBackHandler from 'src/utils/useBackHandler'
import VerificationCountdown from 'src/verify/VerificationCountdown'
import { VerificationFailedModal } from 'src/verify/VerificationFailedModal'

const TAG = 'VerificationLoadingScreen'

const mapStateToProps = (state: RootState) => {
  return {
    e164Number: state.account.e164PhoneNumber,
    verificationStatus: state.identity.verificationStatus,
    retryWithForno: state.account.retryVerificationWithForno,
    fornoMode: state.web3.fornoMode,
  }
}

type Props = StackScreenProps<StackParamList, Screens.VerificationLoadingScreen>

export default function VerificationLoadingScreen({ route }: Props) {
  const verificationStatusRef = useRef<VerificationStatus | undefined>()
  const { fornoMode, retryWithForno, verificationStatus } = useSelector(
    mapStateToProps,
    shallowEqual
  )
  const { t } = useTranslation(Namespaces.nuxVerification2)
  const dispatch = useDispatch()
  const isFocused = useIsFocused()

  const [countdownStartTime, setCountdownStartTime] = useState(Date.now())

  useFocusEffect(
    useCallback(() => {
      setCountdownStartTime(Date.now())
    }, [])
  )

  useEffect(() => {
    if (!isFocused || verificationStatusRef.current === verificationStatus) {
      return
    }
    verificationStatusRef.current = verificationStatus

    if (verificationStatus === VerificationStatus.CompletingAttestations) {
      navigate(Screens.VerificationInputScreen)
    } else if (verificationStatus === VerificationStatus.Done) {
      navigate(Screens.ImportContacts)
    }
  }, [verificationStatus, isFocused])

  useBackHandler(() => {
    // Cancel verification when user presses back button on this screen
    onCancel()
    return true
  }, [])

  const onCancel = () => {
    Logger.debug(TAG + '@onCancel', 'Cancelled, going back to education screen')
    dispatch(cancelVerification())
    navigate(Screens.VerificationEducationScreen)
  }

  const onFinishCountdown = () => {
    // For now switch to the verification screen
    // if we haven't reached the reveal stage yet
    if (!isFocused || verificationStatus === VerificationStatus.CompletingAttestations) {
      return
    }
    navigate(Screens.VerificationInputScreen)
  }

  const onPressLearnMore = () => {
    scrollViewRef.current?.getNode().scrollToEnd({ animated: true })
  }

  const items: CarouselItem[] = [
    {
      icon: verificationEducation1,
      text: t('loading.card1'),
    },
    {
      icon: verificationEducation2,
      text: t('loading.card2'),
    },
    {
      icon: verificationEducation3,
      text: t('loading.card3'),
    },
    {
      icon: verificationEducation4,
      text: t('loading.card4'),
    },
  ]

  const [contentHeight, setContentHeight] = useState(0)
  const scrollViewRef = useRef<typeof Animated.ScrollView>(null)
  const { height: viewportHeight } = useSafeAreaFrame()
  const safeAreaInsets = useSafeAreaInsets()

  const scrollY = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: {
            y: scrollY,
          },
        },
      },
    ],
    {
      useNativeDriver: true,
    }
  )

  const onContentSizeChange = (_w: number, h: number) => {
    setContentHeight(h)
  }

  // height available above the carousel when it's visible
  const reducedHeight = Math.max(viewportHeight - (contentHeight - viewportHeight), 1)

  const statusContainerStyle = useMemo(() => {
    const scale = scrollY.interpolate({
      inputRange: [-100, 0, reducedHeight],
      outputRange: [1.05, 1, 0.8],
    })
    const translateY = scrollY.interpolate({
      inputRange: [0, reducedHeight],
      outputRange: [0, reducedHeight / 1.5],
    })
    return {
      ...styles.statusContainer,
      transform: [{ translateY }, { scale }],
    }
  }, [reducedHeight])

  const learnMoreContainerStyle = useMemo(() => {
    const opacity = scrollY.interpolate({
      inputRange: [0, 200],
      outputRange: [1, 0],
    })
    const translateY = scrollY.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolateRight: 'clamp',
    })

    return {
      opacity,
      transform: [{ translateY }],
    }
  }, [])

  return (
    <View style={styles.container}>
      <KeepAwake />
      <LottieView
        source={require('./backgroundAnim.json')}
        resizeMode="cover"
        autoPlay={true}
        loop={true}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.buttonCancelContainer} edges={['top']}>
        <CancelButton onCancel={onCancel} />
      </SafeAreaView>
      <Animated.ScrollView
        // @ts-ignore This works fine ;)
        ref={scrollViewRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToOffsets={[viewportHeight]}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
      >
        <View
          style={[
            styles.contentContainer,
            {
              height: viewportHeight,
              paddingTop: safeAreaInsets.top,
              paddingBottom: Math.max(safeAreaInsets.bottom, Spacing.Regular16),
            },
          ]}
        >
          <Animated.View style={statusContainerStyle}>
            <Text style={styles.statusText}>{t('loading.confirming')}</Text>
            {!route.params.withoutRevealing && (
              <VerificationCountdown startTime={countdownStartTime} onFinish={onFinishCountdown} />
            )}
          </Animated.View>
          <Animated.View style={learnMoreContainerStyle}>
            <TouchableOpacity style={styles.upHandleContainer} onPress={onPressLearnMore}>
              <UpHandle />
            </TouchableOpacity>
            <Button
              text={t('loading.learnMore')}
              type={BtnTypes.ONBOARDING_SECONDARY}
              size={BtnSizes.SMALL}
              onPress={onPressLearnMore}
            />
          </Animated.View>
        </View>
        <Carousel
          style={{ marginBottom: Math.max(safeAreaInsets.bottom, Spacing.Thick24) }}
          items={items}
        />
      </Animated.ScrollView>
      <VerificationFailedModal
        verificationStatus={verificationStatus}
        retryWithForno={retryWithForno}
        fornoMode={fornoMode}
      />
    </View>
  )
}

VerificationLoadingScreen.navigationOptions = noHeaderGestureDisabled

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  buttonCancelContainer: {
    position: 'absolute',
    top: 10,
    left: 5,
    // Need to set zIndex so custom nav is on top of empty default nav
    zIndex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...fontStyles.h2,
    color: colors.onboardingBrownLight,
    marginBottom: 40,
  },
  upHandleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.Smallest8,
  },
})
