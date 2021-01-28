import * as React from 'react'
import Svg from 'svgs'

interface Props {
  foregroundColor?: string
  backgroundColor?: string
}

export default function DefaultAvatar({ foregroundColor, backgroundColor }: Props) {
  return <Svg width="40" height="40" viewBox="0 0 40 40" fill={backgroundColor} />
}
