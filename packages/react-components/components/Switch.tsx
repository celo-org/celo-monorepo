import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={SWITCH_TRACK}
      thumbColor={colors.gray2}
      ios_backgroundColor={colors.gray3}
      {...props}
    />
  )
}

const SWITCH_TRACK = {
  false: colors.gray3,
  true: colors.greenUI,
}
