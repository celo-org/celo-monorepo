import * as React from 'react'
import { Fade } from 'react-awesome-reveal'

interface Props {
  children: React.ReactNode
  when?: boolean
  delay?: number
  distance?: number | string
  duration?: number
  fraction?: number
  bottom?: boolean
  direction?: 'up' | 'right' | 'left'
}

export default function AwesomeFade({
  children,
  when,
  bottom,
  delay,
  direction,
  duration,
  fraction,
}: Props) {
  const newDirection = bottom ? 'up' : direction

  return (
    <Fade
      direction={newDirection}
      delay={delay}
      reverse={when}
      duration={duration}
      fraction={fraction}
    >
      {children}
    </Fade>
  )
}
