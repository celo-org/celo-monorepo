import { keyframes } from '@emotion/core'
import * as React from 'react'
import Reveal from 'react-awesome-reveal'

type Direction = 'up' | 'right'

interface Props {
  children: React.ReactNode
  delay?: number
  distance?: number | string
  duration?: number
  fraction?: number
  reverse?: boolean
  direction?: Direction
}

export default React.memo(function AwesomeFade({
  children,
  reverse,
  delay,
  distance,
  direction,
  duration,
  fraction,
}: Props) {
  return (
    <Reveal
      keyframes={React.useMemo(() => getKeyFrames(distance, direction, reverse), [
        direction,
        distance,
      ])}
      triggerOnce={false}
      delay={delay}
      duration={duration}
      fraction={fraction}
    >
      {children}
    </Reveal>
  )
})

function getKeyFrames(distance: number | string, direction: Direction, reverse: boolean) {
  let from = `translate3d(0, ${distance}, 0)`

  if (direction === 'right') {
    from = `translate3d(${distance}, 0, 0)`
  }

  if (reverse) {
    return keyframes`
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
    to {
      opacity: 0;
      transform: ${from}; 
    }
  `
  }

  return keyframes`
    from {
      opacity: 0;
      transform: ${from};
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  `
}
