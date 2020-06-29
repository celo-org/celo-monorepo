/** @jsx jsx */

import { css, jsx } from '@emotion/core'
import Chevron from './Chevron'
import colors from './colors'

export default function Button({ children, href }) {
  return (
    <a css={rootStyle} href={href} target="_blank" rel="noopener">
      {children}
      <span>
        <Chevron size={12} />
      </span>
    </a>
  )
}

const rootStyle = css({
  fontSize: 20,
  color: colors.dark,
  textDecoration: 'none',
  display: 'block',
  fontWeight: 'bold',
  marginTop: 8,
  marginBottom: 12,
  span: {
    display: 'inline-block',
    paddingLeft: 4,
    transitionProperty: 'transform, opacity',
    transitionDuration: '300ms',
  },
  '&:hover': {
    span: {
      transform: 'translateX(15%)',
      opacity: 0.85,
    },
  },
  '&:active': {
    span: {
      transform: 'translateX(50%)',
      opacity: 0.65,
    },
  },
})
