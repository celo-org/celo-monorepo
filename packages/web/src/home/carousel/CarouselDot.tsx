import * as React from 'react'
import { typeFaces } from 'src/styles'
import Svg, { Path, Text, TSpan } from 'svgs'

export default ({ height = 102, text = 'Swipe' }) => (
  <Svg width={height} height={height} viewBox="0 0 87 102" fill="none">
    <Path
      d="M82.7818 52.7021C71.7173 81.8061 45.7205 103.829 24.7339 101.88C3.74716 99.9311 -5.73439 76.3491 3.58396 49.1778C12.9023 22.0066 36.598 0 59.3472 0C82.0964 0 93.8627 23.5982 82.7818 52.7021Z"
      fill="#5ED388"
    />
    <Text
      textAnchor="middle"
      fill="white"
      fontFamily={typeFaces.futura}
      fontSize="20"
      letterSpacing="0px"
    >
      <TSpan x="43.5" y="57.32">
        {text}
      </TSpan>
    </Text>
  </Svg>
)
