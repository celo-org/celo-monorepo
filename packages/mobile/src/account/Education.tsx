import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Swiper from 'react-native-swiper'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { placeholder } from 'src/images/Images'

export const CTA_CIRCLE_SIZE = 5

interface State {
  step: number
}

interface EducationStep {
  image: any
  title?: string
  text: string
  cancelEvent: CustomEventNames
  screenName: string
}

interface Props {
  stepInfo: EducationStep[]
  buttonText: string
  onFinish: () => void
  lastStepButtonType?: BtnTypes
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
    this.swiper?.current?.scrollBy(-1, true)
  }

  setStep = (step: number) => {
    this.setState({ step })
  }

  nextStep = () => {
    this.swiper?.current?.scrollBy(1, true)
  }

  render() {
    const { stepInfo, onFinish, buttonText, lastStepButtonType } = this.props

    const isLastStep = this.state.step === stepInfo.length - 1
    return (
      <View style={style.container}>
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
              <View style={style.swipedContent} key={i}>
                <Image source={imgSrc} style={style.bodyImage} resizeMode="contain" />
                <Text style={style.heading}>{step.title}</Text>
                <Text style={style.bodyText}>{step.text}</Text>
              </View>
            )
          })}
        </Swiper>
        <Button
          onPress={isLastStep ? onFinish : this.nextStep}
          text={isLastStep ? buttonText : 'next'}
          type={lastStepButtonType ? lastStepButtonType : BtnTypes.SECONDARY}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
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
})
