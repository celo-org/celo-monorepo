import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import BackChevron from '@celo/react-components/icons/BackChevron.v2'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import progressDots from '@celo/react-components/styles/progressDots'
import * as React from 'react'
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { NativeSafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context'
import Swiper from 'react-native-swiper'
import { OnboardingEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'

export enum EmbeddedNavBar {
  Close = 'Close',
  Drawer = 'Drawer',
}

export enum EducationTopic {
  onboarding = 'onboarding',
  backup = 'backup',
  celo = 'celo',
}

interface EducationStep {
  image: ImageSourcePropType | null
  topic: EducationTopic
  title: string
  // If set to true, title is displayed at the top
  isTopTitle?: boolean
  text?: string
}

export type Props = NativeSafeAreaViewProps & {
  embeddedNavBar: EmbeddedNavBar | null
  stepInfo: EducationStep[]
  buttonType: BtnTypes
  buttonText: string
  finalButtonType: BtnTypes
  finalButtonText: string
  dotStyle: StyleProp<ViewStyle>
  activeDotStyle: StyleProp<ViewStyle>
  onFinish: () => void
}

interface State {
  step: number
}

export default class Education extends React.Component<Props, State> {
  static defaultProps = {
    buttonType: BtnTypes.SECONDARY,
    finalButtonType: BtnTypes.PRIMARY,
    dotStyle: progressDots.circlePassive,
    activeDotStyle: progressDots.circleActive,
  }

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
      } else if (topic === EducationTopic.onboarding) {
        ValoraAnalytics.track(OnboardingEvents.onboarding_education_scroll, {
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
      } else if (topic === EducationTopic.onboarding) {
        ValoraAnalytics.track(OnboardingEvents.onboarding_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      }
      this.swiper?.current?.scrollBy(1, true)
    }
  }

  renderEmbeddedNavBar() {
    switch (this.props.embeddedNavBar) {
      case EmbeddedNavBar.Close:
        return (
          <View style={styles.top} testID="Education/top">
            <TopBarIconButton
              testID="Education/CloseIcon"
              onPress={this.goBack}
              icon={this.state.step === 0 ? <Times /> : <BackChevron color={colors.dark} />}
            />
          </View>
        )
      case EmbeddedNavBar.Drawer:
        return <DrawerTopBar testID="DrawerTopBar" />
      default:
        return null
    }
  }

  render() {
    const {
      style,
      embeddedNavBar,
      stepInfo,
      buttonType,
      buttonText,
      finalButtonType,
      finalButtonText,
      dotStyle,
      activeDotStyle,
      ...passThroughProps
    } = this.props
    const isLastStep = this.state.step === stepInfo.length - 1

    return (
      <SafeAreaView style={[styles.root, style]} {...passThroughProps}>
        {this.renderEmbeddedNavBar()}
        <View style={styles.container}>
          <Swiper
            ref={this.swiper}
            onIndexChanged={this.setStep}
            loop={false}
            dotStyle={dotStyle}
            activeDotStyle={activeDotStyle}
          >
            {stepInfo.map((step: EducationStep, i: number) => {
              return (
                <View style={styles.swipedContent} key={i}>
                  {step.isTopTitle && <Text style={styles.headingTop}>{step.title}</Text>}
                  <View style={styles.swipedContentInner}>
                    {step.image && (
                      <Image source={step.image} style={styles.bodyImage} resizeMode="contain" />
                    )}
                    {!step.isTopTitle && <Text style={styles.heading}>{step.title}</Text>}
                    {!!step.text && <Text style={styles.bodyText}>{step.text}</Text>}
                  </View>
                </View>
              )
            })}
          </Swiper>
          <Button
            testID="Education/progressButton"
            onPress={this.nextStep}
            text={isLastStep ? finalButtonText : buttonText}
            type={isLastStep ? finalButtonType : buttonType}
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
    paddingBottom: 24,
  },
  heading: {
    marginTop: 24,
    ...fontStyles.h2,
    textAlign: 'center',
  },
  headingTop: {
    ...fontStyles.h1,
    marginTop: 26,
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
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  swipedContentInner: {
    flex: 1,
    justifyContent: 'center',
  },
  top: {
    paddingLeft: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    width: '100%',
  },
})
