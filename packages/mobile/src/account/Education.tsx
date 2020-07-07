import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import BackChevron from '@celo/react-components/icons/BackChevron.v2'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Swiper from 'react-native-swiper'
import { OnboardingEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'

interface State {
  step: number
}

export enum EducationTopic {
  backup = 'backup',
  celo = 'celo',
}

interface EducationStep {
  image: ImageSourcePropType | null
  topic: EducationTopic
  title: string
  text: string
}

export interface Props {
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
    const { step } = this.state
    const { topic } = this.props.stepInfo[this.state.step]
    if (step === 0) {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_cancel)
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_cancel)
      }
      navigateBack()
    } else {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.previous,
        })
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.previous,
        })
      }
      this.swiper?.current?.scrollBy(-1, true)
    }
  }

  setStep = (step: number) => {
    this.setState({ step })
  }

  nextStep = () => {
    const { step } = this.state
    const { topic } = this.props.stepInfo[this.state.step]
    const isLastStep = step === this.props.stepInfo.length - 1

    if (isLastStep) {
      this.props.onFinish()
      this.swiper?.current?.scrollTo(0)
    } else {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      }
      this.swiper?.current?.scrollBy(1, true)
    }
  }

  render() {
    const { stepInfo, buttonText, finalButtonType, finalButtonText, isClosable } = this.props

    const isLastStep = this.state.step === stepInfo.length - 1
    return (
      <SafeAreaView style={styles.root}>
        {(isClosable && (
          <View style={styles.top} testID="Education/top">
            <TopBarIconButton
              testID="Education/CloseIcon"
              onPress={this.goBack}
              icon={this.state.step === 0 ? <Times /> : <BackChevron color={colors.dark} />}
            />
          </View>
        )) || <DrawerTopBar testID="DrawerTopBar" />}
        <View style={styles.container}>
          <Swiper
            ref={this.swiper}
            onIndexChanged={this.setStep}
            loop={false}
            dotStyle={progressDots.circlePassive}
            activeDotStyle={progressDots.circleActive}
          >
            {stepInfo.map((step: EducationStep, i: number) => {
              return (
                <View style={styles.swipedContent} key={i}>
                  {step.image && (
                    <Image source={step.image} style={styles.bodyImage} resizeMode="contain" />
                  )}
                  <Text style={styles.heading}>{step.title}</Text>
                  <Text style={styles.bodyText}>{step.text}</Text>
                </View>
              )
            })}
          </Swiper>
          <Button
            testID="Education/progressButton"
            onPress={this.nextStep}
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
