import Touchable from '@celo/react-components/components/Touchable'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import InfoIcon from 'src/icons/InfoIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface Props {
  isExchange?: boolean
  isGrey?: boolean
}

export default class FeeIcon extends React.Component<Props> {
  static defaultProps = {
    isExchange: false,
    isGrey: false,
  }

  navigateToEducate() {
    console.log(JSON.stringify(this.props))
    if (this.props.isExchange) {
      navigate(Screens.FeeExchangeEducation, {})
    } else {
      navigate(Screens.FeeEducation, {})
    }
  }

  render() {
    return (
      <Touchable
        onPress={this.navigateToEducate}
        style={styles.area}
        borderless={true}
        hitSlop={iconHitslop}
      >
        <InfoIcon size={12} isGrey={this.props.isGrey} />
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})
