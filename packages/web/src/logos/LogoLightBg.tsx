import * as React from 'react'
import Logo, { ColorScheme } from 'src/logos/Logo'

interface Props {
  height?: number
  allBlack?: boolean
}

export default function LogoDarkBg(props: Props) {
  return <Logo colorScheme={colorScheme(props)} height={props.height} />
}

function colorScheme({ allBlack }: Props) {
  if (allBlack) {
    return ColorScheme.allBlack
  }
  return ColorScheme.lightBG
}
