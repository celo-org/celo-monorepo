import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Dimensions, Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Swiper from 'react-native-swiper'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import { placeholder } from 'src/images/Images'
import { navigateBack } from 'src/navigator/NavigationService'

const PROGRESS_CIRCLE_PASSIVE_SIZE = 8
const PROGRESS_CIRCLE_ACTIVE_SIZE = 12

export const CTA_CIRCLE_SIZE = 5

interface State {
  step: number
}

interface EducationStep {
  image: any
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

type Props = WithNamespaces & CustomizedProps

class Education extends React.Component<Props, State> {
  state = {
    step: 0,
  }

  goBack = () => {
    const currentStepInfo = this.props.stepInfo[this.state.step]
    if (currentStepInfo.cancelEvent && currentStepInfo.screenName) {
      CeloAnalytics.track(currentStepInfo.cancelEvent, {
        screen: currentStepInfo.screenName,
      })
    }
    navigateBack()
  }

  setStep = (step: number) => {
    this.setState({ step })
  }

  renderHeader() {
    const { t } = this.props
    return (
      <View style={style.header}>
        <View style={style.goBack}>
          <Touchable testID="Education-goback" borderless={true} onPress={this.goBack}>
            <Text style={fontStyles.headerButton}> {t('cancel')}</Text>
          </Touchable>
        </View>
      </View>
    )
  }

  renderBody() {
    const { t, stepInfo } = this.props
    const children = stepInfo.map((v: any, i: any) => {
      const imgSrc = v.image ? v.image : placeholder
      return (
        <View style={style.swipedContent} key={i}>
          <Image source={imgSrc} style={style.bodyImage} resizeMode="contain" />
          <Text style={[fontStyles.h1, style.bodyText]}>{t(v.text)}</Text>
        </View>
      )
    })

    return (
      <View style={style.body}>
        {/* 
        // @ts-ignore */}
        <Swiper
          onIndexChanged={this.setStep}
          loop={false}
          showsButtons={false}
          showsPagination={true}
          style={style.swiper}
          // @ts-ignore
          dotStyle={passiveDotStyle}
          // @ts-ignore
          activeDotStyle={activeDotStyle}
          containerStyle={style.swiperContainer}
        >
          {children}
        </Swiper>
      </View>
    )
  }

  renderFooter() {
    const { t, stepInfo, onFinish, onFinishAlternate, buttonText, linkText } = this.props
    if (this.state.step !== stepInfo.length - 1) {
      return <View style={style.footer} />
    }
    return (
      <View style={style.footer}>
        <View style={style.buttonContainer}>
          <Button
            text={t(buttonText)}
            onPress={onFinish}
            style={style.button}
            standard={true}
            type={BtnTypes.PRIMARY}
          />
        </View>
        {onFinishAlternate ? (
          <Button
            text={t(linkText ? linkText : 'backToWallet')}
            onPress={onFinishAlternate}
            style={style.button}
            standard={true}
            type={BtnTypes.TERTIARY}
          />
        ) : null}
      </View>
    )
  }

  render() {
    return (
      <View style={style.container}>
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderFooter()}
      </View>
    )
  }
}

const { width } = Dimensions.get('window')
const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    margin: 0,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
  },
  goBack: {
    flex: 0,
  },
  body: {
    flex: 8,
    alignItems: 'center',
  },
  bodyText: {
    color: colors.darkSecondary,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  bodyImage: {
    alignSelf: 'center',
    width: 200,
    height: 200,
  },
  footer: {
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    flex: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footerLink: {
    color: colors.celoGreen,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  circleContainer: {
    flex: 0,
    width: PROGRESS_CIRCLE_PASSIVE_SIZE,
    height: PROGRESS_CIRCLE_PASSIVE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  circle: {
    flex: 0,
    backgroundColor: colors.inactive,
    borderRadius: 8,
  },
  circlePassive: {
    height: PROGRESS_CIRCLE_PASSIVE_SIZE,
    width: PROGRESS_CIRCLE_PASSIVE_SIZE,
  },
  circleActive: {
    height: PROGRESS_CIRCLE_ACTIVE_SIZE,
    width: PROGRESS_CIRCLE_ACTIVE_SIZE,
  },
  swiper: {
    alignItems: 'center',
    flex: 1,
    width,
  },
  swiperContainer: {
    alignItems: 'center',
  },
  swipedContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 60,
  },
})

const activeDotStyle: ViewStyle = StyleSheet.flatten([style.circle, style.circleActive])
const passiveDotStyle: ViewStyle = StyleSheet.flatten([style.circle, style.circlePassive])

export default componentWithAnalytics(withNamespaces(Namespaces.nuxCurrencyPhoto4)(Education))
