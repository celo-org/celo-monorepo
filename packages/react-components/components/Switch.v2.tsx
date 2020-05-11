import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={switchTrackColors}
      thumbColor={colors.gray2}
      ios_backgroundColor={colors.gray3}
      {...props}
    />
  )
}

const switchTrackColors = {
  false: colors.gray3,
  true: colors.greenUI,
}
