import * as React from 'react'
import Fade from 'src/shared/AwesomeFade'

interface Props {
  children: React.ReactNode
  when?: boolean
  distance?: number
  bottom?: boolean
}

export default function AwesomeFade({ children, when, bottom }: Props) {
  const direction = bottom ? 'up' : undefined

  return (
    <Fade direction={direction} reverse={when}>
      {children}
    </Fade>
  )
}
