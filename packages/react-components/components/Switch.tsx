import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'

function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={switchTrackColors}
      thumbColor={colors.light}
      ios_backgroundColor={colors.gray4}
      {...props}
    />
  )
}

const switchTrackColors = {
  false: colors.gray4,
  true: colors.greenBrand,
}

export default Switch
