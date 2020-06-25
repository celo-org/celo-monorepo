/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import * as React from 'react'
import Button from 'src/components/Button'
import CopyIcon from 'src/components/CopyIcon'

interface Props {
  dai: string
  btc: string
  celo: string
  custody: string
  eth: string
}

export default function ReserveAddresses({ dai, btc, celo, custody, eth }: Props) {
  return (
    <>
      <Address label="CELO" hex={celo} />
      <Address label="CELO in Custody" hex={custody} />
      <Address label="BTC" hex={btc} />
      <Address label="ETH" hex={eth} />
      <Address label="DAI" hex={dai} />
      <Button href="https://docs.celo.org/command-line-interface/reserve">
        Query Reserve Holdings
      </Button>
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
