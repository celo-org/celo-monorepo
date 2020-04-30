import * as React from 'react'
import Logo, { ColorScheme } from 'src/logos/Logo'

interface Props {
  height?: number
  allWhite?: boolean
}

export default function LogoDarkBg(props: Props) {
  return <Logo colorScheme={colorScheme(props)} height={props.height} />
}

function colorScheme({ allWhite }: Props) {
  if (allWhite) {
    return ColorScheme.allWhite
  }
  return ColorScheme.darkBG
}
