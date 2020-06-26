/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import colors from 'src/components/colors'
const DATA: ChartData[] = [
  { color: colors.gold, token: 'CELO', percent: 50 },
  { color: colors.blue, token: 'BTC', percent: 30 },
  { color: colors.red, token: 'ETH', percent: 15 },
  { color: colors.green, token: 'Stable value portfolio*', percent: 5 },
]

const DATA_WITH_OFFSETS = DATA.map((data, index) => {
  let offset = 0
  let i = index - 1
  while (i >= 0) {
    offset = offset + DATA[i].percent
    --i
  }
  return { offset, ...data }
})

export default function TargetGraph() {
  const radius = 10
  const circumfrance = Math.PI * 2 * radius
  return (
    <div css={rootStyle}>
      <div css={legendStyle}>
        <h4>Initial Target</h4>
        {DATA.map(({ color, token, percent }) => (
          <ChartKey color={color} token={token} percent={percent} />
        ))}
        <small>
          *Crypto Assets with low volatility. Candidates are decentralised stablecoins e.g. DAI
        </small>
      </div>
      <div css={pieStyle}>
        <svg viewBox="-25 -25 50 50" transform="rotate(-90)" width="100%" height="100%">
          {DATA_WITH_OFFSETS.map(({ color, percent, offset }) => {
            return (
              <>
                <circle
                  cx="0"
                  cy="0"
                  opacity={0.8}
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="9"
                  strokeDasharray={`${circumfrance * (percent / 100)} ${circumfrance *
                    (1 - percent / 100)}`}
                  transform={`rotate(${(offset * 360) / 100})`}
                />
                <line
                  x1="0"
                  x2="11"
                  y1="0"
                  y2="11"
                  stroke="white"
                  strokeWidth="0.25"
                  transform={`rotate(${((offset - 12.5) * 360) / 100})`}
                />
              </>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

const legendStyle = css({
  minWidth: 200,
  flex: 2,
})

const pieStyle = css({ display: 'flex', flex: 3, minWidth: 250 })

const rootStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  paddingLeft: 15,
  maxWidth: '100%',
  width: 670,
})

interface ChartData {
  color: colors
  token: string
  percent: number
}

function ChartKey({ color, token, percent }: ChartData) {
  return (
    <div css={chartKeyStyle}>
      <div css={css(squareStyle, { backgroundColor: color as string })} />
      <span css={percentStyle}>{percent}%</span>
      <span>{token}</span>
    </div>
  )
}

const squareStyle = css({ width: 20, height: 20, borderRadius: 3 })
const chartKeyStyle = css({
  display: 'flex',
  marginBottom: 10,
  fontSize: 20,
})

const percentStyle = css({
  fontWeight: 'bold',
  paddingLeft: 10,
  paddingRight: 8,
})
