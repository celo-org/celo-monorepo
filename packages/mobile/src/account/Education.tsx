import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Swiper from 'react-native-swiper'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces, withTranslation } from 'src/i18n'
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

interface CustomizedProps {
  stepInfo: EducationStep[]
  buttonText: string
  linkText?: string
  onFinish: () => void
  onFinishAlternate?: () => void
}

type Props = WithTranslation & CustomizedProps

class Education extends React.Component<Props, State> {
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
    console.warn('HELLO')
    this.setState({ step })
  }

  nextStep = () => {
    this.swiper?.current?.scrollBy(1, true)
  }

  render() {
    const { t, stepInfo, onFinish, buttonText } = this.props

    const isLastStep = this.state.step === stepInfo.length - 1
    return (
      <View style={style.container}>
        {/* 
        // @ts-ignore */}
        <Swiper
          ref={this.swiper}
          onIndexChanged={this.setStep}
          loop={false}
          dotStyle={progressDots.circlePassive}
          activeDotStyle={progressDots.circleActive}
        >
          {stepInfo.map((v: any, i: any) => {
            const imgSrc = v.image ? v.image : placeholder
            return (
              <View style={style.swipedContent} key={i}>
                <Image source={imgSrc} style={style.bodyImage} resizeMode="contain" />
                <Text style={style.heading}>{t(v.title)}</Text>
                <Text style={style.bodyText}>{t(v.text)}</Text>
              </View>
            )
          })}
        </Swiper>
        <Button
          onPress={isLastStep ? onFinish : this.nextStep}
          text={t(isLastStep ? buttonText : 'next')}
          type={BtnTypes.SECONDARY}
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

export default withTranslation(Namespaces.nuxCurrencyPhoto4)(Education)
