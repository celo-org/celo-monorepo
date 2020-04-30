import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Rect } from 'svgs'
interface Props {
  color: colors
  size: number
}

export default function Arrow(props: Props) {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 42 42" fill="none">
      <Rect
        width="4"
        height="25"
        transform="matrix(0.707259 0.706954 -0.707259 0.706954 35.8002 20.5585)"
        fill={props.color}
      />
      <Rect
        width="4"
        height="25"
        transform="matrix(0.707488 -0.706726 0.707488 0.706726 3.2733 23.3868)"
        fill={props.color}
      />
      <Rect x="19" y="2.0033" width="4" height="37" fill={props.color} />
    </Svg>
  )
}
