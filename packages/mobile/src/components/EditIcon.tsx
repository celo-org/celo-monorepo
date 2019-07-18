import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import componentWithAnalytics from 'src/analytics/wrapper'

interface Props {
  width?: number
  height?: number
}

const EditIcon = (props: Props) => (
  <Svg width={props.width || 30} height={props.height || 29} viewBox="0 0 39 38">
    <Path
      d="M25.517 15.658l9.238-7.75a.997.997 0 0 1 1.405.132l1.826 2.176a1 1 0 0 1-.113 1.407L9.678 35.282 6.56 31.565l6.699-5.62c5.906-.527 10.756-4.72 12.258-10.287zM8.85 35.85L4.038 37.5c-.519.178-.74-.075-.488-.58l2.315-4.627 2.984 3.556zM0 12C0 5.373 5.371 0 12 0c6.627 0 12 5.371 12 12 0 6.627-5.371 12-12 12-6.627 0-12-5.371-12-12zm18-.07h-2.93l-.442 1.652h1.72v1.021a4.888 4.888 0 0 1-3.823 1.85 4.878 4.878 0 0 1-4.872-4.872 4.878 4.878 0 0 1 4.872-4.872c1.35 0 2.622.666 3.542 1.64l.482-1.906a6.502 6.502 0 0 0-3.552-1.37l.022-2.056L11.424 3 11.4 5.154A6.534 6.534 0 0 0 6 11.581c0 3.26 2.404 5.97 5.531 6.45l-.02 2.069 1.595.017.02-2.039a6.548 6.548 0 0 0 4.721-2.72l.153-.216V11.93z"
      fill="#FFF"
      fill-rule="evenodd"
    />
  </Svg>
)

export default componentWithAnalytics(EditIcon)
