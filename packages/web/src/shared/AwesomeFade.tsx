import { keyframes } from '@emotion/core'
import * as React from 'react'
import Reveal from 'react-awesome-reveal'

interface Props {
  children: React.ReactNode
  when?: boolean
  delay?: number
  distance?: number | string
  duration?: number
  fraction?: number
  bottom?: boolean
  reverse?: boolean
  direction?: 'up' | 'right' | 'left'
}

export default function AwesomeFade({
  children,
  when,
  bottom,
  delay,
  distance,
  direction,
  duration,
  reverse,
  fraction,
}: Props) {
  const fadeInUp = keyframes`
    from {
      opacity: 0;
      transform: translate3d(0, ${distance}, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  `

  return (
    <Reveal
      keyframes={fadeInUp}
      triggerOnce={true}
      delay={delay}
      duration={duration}
      fraction={fraction}
    >
      {children}
    </Reveal>
  )
}
