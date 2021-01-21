import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'svgs'


interface Props {
  height?: number
  color?: string
  selected?: boolean
  disabled?:boolean
}

const styles = StyleSheet.create({
  circle: {
    paddingTop: 2,
    height: 20,
    width: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray4,
  },
})

export default class RadioButton extends React.PureComponent<Props> {
  static defaultProps = {
    width: 20,
    height: 20,
    color: colors.greenUI,
    selected: true, 
    disabled: false,
  }
  
  

  render() {
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        height={this.props.height}
        width={this.props.height}
        viewBox="0 0 20 20"
      >
      <Circle cx="10" cy="10" r="9" stroke={this.props.disabled ? colors.gray2 : this.props.color} strokeWidth={2} />  
      {this.props.selected ? <Circle cx="10" cy="10" r="6" fill={this.props.color} /> : <View style={styles.circle} />
  }
      </Svg>
    )
  }
}
