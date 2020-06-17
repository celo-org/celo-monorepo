/** @jsx jsx */
import * as React from 'react'
import { jsx, css } from '@emotion/core'
import CopyIcon from 'components/CopyIcon'

export default function ReserveAddresses() {
  return (
    <>
      <Address label="CELO" hex={'0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9'} />
      <Address label="CELO in Custody" hex={'0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9'} />
      <Address label="BTC" hex={'0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9'} />
      <Address label="ETH" hex={'0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9'} />
      <Address label="DAI" hex={'0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9'} />
    </>
  )
}
const MILLISECONDS = 5000

function useCopy(hex) {
  const [justCopied, setCopied] = React.useState(false)

  function onPress() {
    onCopy(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), MILLISECONDS)
  }

  return { onPress, justCopied }
}

function Address({ label, hex }) {
  const { onPress, justCopied } = useCopy(hex)

  return (
    <div onClick={onPress} css={rootStyle}>
      <h5 css={labelStyle}>{label}</h5>
      <span css={css({ wordWrap: 'break-word' })}>
        {hex} <CopyIcon /> <span className="info">{justCopied ? 'Copied' : 'Copy'}</span>
      </span>
    </div>
  )
}

async function onCopy(text: string) {
  await navigator.clipboard.writeText(text)
}

const labelStyle = css({ marginBottom: 5, marginTop: 10 })

const rootStyle = css({
  marginBottom: 24,
  cursor: 'pointer',
  '&:active': {
    svg: {
      transform: 'scale(1.1)',
    },
  },
  '.info': {
    opacity: 0,
    transitionProperty: 'opacity',
    transitionDuration: '400ms',
  },
  '&:hover': {
    '.info': {
      opacity: 1,
    },
  },
})
