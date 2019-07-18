import PulsingDot from '@celo/react-components/components/PulsingDot'
import Checkmark from '@celo/react-components/icons/Checkmark'
import SmoothX from '@celo/react-components/icons/SmoothX'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { isE2EEnv } from 'src/config'

const CIRCLE_START_SIZE = 12
const CHECKMARK_SIZE = 18
const X_SIZE = 14

const Circle = () => (
  <View style={style.iconContainer}>
    <View style={style.circle} />
  </View>
)

const GreenCheckmark = () => (
  <View style={style.iconContainer}>
    <Checkmark height={CHECKMARK_SIZE} width={CHECKMARK_SIZE} />
  </View>
)

const AnimatedCircle = () => (
  <View style={style.iconContainer}>
    <PulsingDot color={colors.inactive} circleStartSize={CIRCLE_START_SIZE} animated={!isE2EEnv} />
  </View>
)

const RedX = () => (
  <View style={style.iconContainer}>
    <SmoothX height={X_SIZE} color={colors.errorRed} />
  </View>
)

const ProgressIndicator = (transitionStep: number, currentStep: number, hasFailure: boolean) => {
  if (transitionStep > currentStep) {
    return Circle()
  } else if (transitionStep === currentStep && !hasFailure) {
    return AnimatedCircle()
  } else if (transitionStep === currentStep && hasFailure) {
    return RedX()
  } else {
    return GreenCheckmark()
  }
}

interface Props {
  step: number
  hasFailure: boolean
}

export default class ProgressIndicatorRow extends React.Component<Props> {
  render() {
    return (
      <View style={style.container}>
        {ProgressIndicator(0, this.props.step, this.props.hasFailure)}
        {ProgressIndicator(1, this.props.step, this.props.hasFailure)}
        {ProgressIndicator(2, this.props.step, this.props.hasFailure)}
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    width: CIRCLE_START_SIZE * 3,
  },
  circle: {
    backgroundColor: colors.inactive,
    height: CIRCLE_START_SIZE,
    width: CIRCLE_START_SIZE,
    borderRadius: CIRCLE_START_SIZE / 2,
  },
})
