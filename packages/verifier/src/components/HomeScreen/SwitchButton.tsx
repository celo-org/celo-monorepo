import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { StyleSheet, Switch, TextStyle, View } from 'react-native'

interface SwitchButtonProps {
  style?: TextStyle
  switchStatus: boolean
  onToggle: () => void
}

class SwitchButton extends React.Component<SwitchButtonProps> {
  render() {
    const { onToggle, switchStatus, style } = this.props
    return (
      <View style={[styles.switchContainer, style]}>
        <Switch
          style={styles.switch}
          thumbColor={colors.white}
          trackColor={{ true: colors.celoGreen, false: colors.darkSecondary }}
          onValueChange={onToggle}
          value={switchStatus}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  switchContainer: {
    alignContent: 'center',
    justifyContent: 'center',
  },
  switch: {
    padding: 5,
  },
})

export default SwitchButton
