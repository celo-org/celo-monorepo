import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import InfoIcon from 'src/icons/InfoIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface Props {
  isExchange?: boolean
  tintColor: string
}

export default class FeeIcon extends React.Component<Props> {
  static defaultProps = {
    tintColor: colors.lightGray,
  }

  navigateToEducate() {
    navigate(Screens.FeeEducation, {})
  }

  navigateToExchangeEducate() {
    navigate(Screens.FeeExchangeEducation, {})
  }

  render() {
    return (
      <Touchable
        onPress={this.props.isExchange ? this.navigateToExchangeEducate : this.navigateToEducate}
        style={styles.area}
        borderless={true}
        hitSlop={iconHitslop}
      >
        <InfoIcon size={12} tintColor={this.props.tintColor} />
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
