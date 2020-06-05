import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import BackChevron from '@celo/react-components/icons/BackChevron.v2'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import Swiper from 'react-native-swiper'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { placeholder } from 'src/images/Images'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'

interface State {
  step: number
}

interface EducationStep {
  image: ImageSourcePropType | null
  title: string
  text: string
  cancelEvent: CustomEventNames
  progressEvent: CustomEventNames
  screenName: string
}

interface Props {
  isClosable: boolean
  stepInfo: EducationStep[]
  buttonText: string
  finalButtonText: string
  onFinish: () => void
  finalButtonType?: BtnTypes
}

export default class Education extends React.Component<Props, State> {
  state = {
    step: 0,
  }

  swiper = React.createRef<Swiper>()

  goBack = () => {
    const currentStepInfo = this.props.stepInfo[this.state.step]
    if (currentStepInfo.cancelEvent && currentStepInfo.screenName) {
      CeloAnalytics.track(currentStepInfo.cancelEvent, {
        screen: currentStepInfo.screenName,
      })
    }
    if (this.state.step === 0) {
      navigateBack()
    } else {
      this.swiper?.current?.scrollBy(-1, true)
    }
  }

  setStep = (step: number) => {
    this.setState({ step })
  }

  nextStep = () => {
    const currentStepInfo = this.props.stepInfo[this.state.step]
    CeloAnalytics.track(currentStepInfo.progressEvent)
    this.swiper?.current?.scrollBy(1, true)
  }

  render() {
    const {
      stepInfo,
      onFinish,
      buttonText,
      finalButtonType,
      finalButtonText,
      isClosable,
    } = this.props

    const isLastStep = this.state.step === stepInfo.length - 1
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.top}>
          {isClosable && (
            <TopBarIconButton
              onPress={this.goBack}
              icon={this.state.step === 0 ? <Times /> : <BackChevron color={colors.dark} />}
            />
          )}
        </View>
        <View style={styles.container}>
          <Swiper
            ref={this.swiper}
            onIndexChanged={this.setStep}
            loop={false}
            dotStyle={progressDots.circlePassive}
            activeDotStyle={progressDots.circleActive}
          >
            {stepInfo.map((step: EducationStep, i: number) => {
              const imgSrc = step.image ? step.image : placeholder
              return (
                <View style={styles.swipedContent} key={i}>
                  <Image source={imgSrc} style={styles.bodyImage} resizeMode="contain" />
                  <Text style={styles.heading}>{step.title}</Text>
                  <Text style={styles.bodyText}>{step.text}</Text>
                </View>
              )
            })}
          </Swiper>
          <Button
            onPress={isLastStep ? onFinish : this.nextStep}
            text={isLastStep ? finalButtonText : buttonText}
            type={isLastStep && finalButtonType ? finalButtonType : BtnTypes.SECONDARY}
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingBottom: 24,
  },
  heading: {
    marginTop: 24,
    ...fontStyles.h2,
    textAlign: 'center',
  },
  bodyText: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingTop: 16,
  },
  bodyImage: {
    alignSelf: 'center',
    width: 200,
    height: 200,
  },
  swipedContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  top: {
    paddingLeft: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    width: '100%',
  },
})
