import SmoothX from '@celo/react-components/icons/SmoothX'
import colors from '@celo/react-components/styles/colors'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

interface ButtonProps {
  onPress: () => void
  solid: boolean
  style?: any
  size?: number
  borderWidth?: number
  disabled?: boolean
  activeColor?: string
  inactiveColor?: string
}

export default class CircleButton extends React.PureComponent<ButtonProps> {
  static defaultProps = {
    size: 50,
    disable: false,
    activeColor: colors.greenBrand,
    inactiveColor: colors.greenFaint,
  }

  render() {
    const { onPress, solid, borderWidth, disabled, size, activeColor, inactiveColor } = this.props
    const color = disabled ? inactiveColor : activeColor
    const buttonStyle = [
      style.button,
      solid ? { backgroundColor: color } : { backgroundColor: 'transparent' },
      borderWidth !== undefined ? { borderWidth } : { borderWidth: 0 },
      { borderColor: color, width: size, height: size, borderRadius: Math.floor(size! / 2) },
    ]
    const xColor = solid ? colors.light : color

    return (
      <View style={[style.row, this.props.style]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          style={buttonStyle}
          hitSlop={iconHitslop}
        >
          <SmoothX height={Math.floor(size! * 0.4)} color={xColor} />
        </TouchableOpacity>
      </View>
    )
  }
}

const style = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
