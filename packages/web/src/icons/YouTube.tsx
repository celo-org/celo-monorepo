import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { Path } from 'svgs'

interface Props {
  color: colors
  size: number
}

export default React.memo(function YouTube({ color, size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 33 23" fill="none">
      <title>YouTube</title>
      <Path
        d="M31.6935 3.59097C31.322 2.17758 30.224 1.06468 28.8317 0.68629C26.3083 0 16.1852 0 16.1852 0C16.1852 0 6.06209 0 3.53867 0.68629C2.14638 1.06468 1.04836 2.17758 0.676835 3.59097C0 6.15436 0 11.5 0 11.5C0 11.5 0 16.8456 0.676835 19.409C1.04836 20.8224 2.14638 21.9353 3.53867 22.3137C6.06209 23 16.1852 23 16.1852 23C16.1852 23 26.3083 23 28.8317 22.3137C30.224 21.9353 31.322 20.8224 31.6935 19.409C32.3704 16.8456 32.3704 11.5 32.3704 11.5C32.3704 11.5 32.3704 6.15436 31.6935 3.59097ZM12.8746 16.3541V6.64589L21.335 11.5L12.8746 16.3541Z"
        fill={color}
      />
    </Svg>
  )
})
