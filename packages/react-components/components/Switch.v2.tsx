import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={switchTrackColors}
      thumbColor={colors.white}
      ios_backgroundColor={colors.inactive}
      {...props}
    />
  )
}

const switchTrackColors = {
  false: colors.inactive,
  true: colors.celoGreen,
}
