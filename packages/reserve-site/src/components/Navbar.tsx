/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import colors from 'src/components/colors'

export default function NavBar() {
  return (
    <nav css={navStyle}>
      <a css={linkStyle} href="/">
        Celo Reserve <span />
      </a>
      <div css={navLinksStyle}></div>
    </nav>
  )
}

const navLinksStyle = css({
  alignItems: 'center',
  alignContent: 'center',
  display: 'flex',
  label: 'links',
})

const navStyle = css({
  boxSizing: 'border-box',
  maxWidth: 1280,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'cemter',
  alignSelf: 'center',
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 10,
  paddingBottom: 10,
  '@media (max-width: 500px)': {
    paddingLeft: 0,
  },
})

const linkStyle = {
  marginLeft: 10,
  marginRight: 10,
  padding: 10,
  paddingLeft: 5,
  fontSize: 24,
  letterSpacing: '-0.02em',
  fontWeight: 500,
  color: colors.dark,
  cursor: 'pointer',
  textDecoration: 'none',
  span: {
    transitionProperty: 'transform',
    transitionDuration: '300ms',
    display: 'inline-block',
    width: '100%',
    height: 1,
    backgroundColor: colors.dark,
    transform: 'scale(0)',
  },
  '&:hover': {
    span: {
      transform: 'scale(1)',
    },
  },
}
