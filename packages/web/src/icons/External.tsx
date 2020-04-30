import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  color: colors
  size: number
}

export default function External(props: Props) {
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M14 0V7.17528H11.9502V3.49949L6.80322 8.64724L5.35403 7.19578L10.501 2.05008H6.82987V0H14Z"
        fill={props.color}
      />
      <Path
        d="M9.90044 9.22533H11.9502V14H0V2.05005H4.77599V4.10013H2.04978V11.9499H9.90044V9.22533Z"
        fill={props.color}
      />
    </Svg>
  )
}
