import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { Path, Svg } from 'react-native-svg'

const Gift = () => {
  return (
    <Svg width="12" height="13" viewBox="0 0 12 13" fill="none">
      <Path
        d="M6.25 4C6.11377 3.012 5.44232 1.28449 3.79792 1.03602C1.34584 0.665501 0.528477 3.25896 2.98056 3.99996L9.51944 3.99996C11.9715 3.25896 11.1542 0.665499 8.70209 1.03601C7.05768 1.28449 6.38622 3.012 6.25 4Z"
        stroke={colors.greenStrong}
        stroke-width="1.3"
      />
      <Path
        d="M2 5.5H5.5V13H2C1.44772 13 1 12.5523 1 12V6.5C1 5.94772 1.44772 5.5 2 5.5Z"
        fill={colors.greenStrong}
      />
      <Path
        d="M7 5.5H10.5C11.0523 5.5 11.5 5.94772 11.5 6.5V12C11.5 12.5523 11.0523 13 10.5 13H7V5.5Z"
        fill={colors.greenStrong}
      />
    </Svg>
  )
}

export default React.memo(Gift)
