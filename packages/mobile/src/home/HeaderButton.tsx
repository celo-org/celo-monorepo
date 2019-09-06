import Touchable, { Props } from '@celo/react-components/components/Touchable'
import React from 'react'

const HIT_SLOP = { left: 15, bottom: 15, top: 15, right: 15 }

export default function HeaderButton(props: Props) {
  return <Touchable borderless={true} hitSlop={HIT_SLOP} {...props} />
}
