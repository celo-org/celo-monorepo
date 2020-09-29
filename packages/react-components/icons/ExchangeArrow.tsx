import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

export default class ExchangeArrow extends React.PureComponent {
  render() {
    return (
      <Svg width="9" height="6" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <Path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M5.0998 5.45001L8.39993 3.02504L5.0998 0.600067V2.22512L0.399933 2.22512V3.82518L5.0998 3.82518V5.45001Z"
          fill={colors.gray5}
        />
      </Svg>
    )
  }
}
