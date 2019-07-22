import * as React from 'react'
import Svg, { Path } from 'svgs'

export default class Lock extends React.PureComponent {
  render() {
    return (
      <Svg width="31" height="43" viewBox="0 0 31 43" fill="none">
        <Path
          d="M27.1686 18.9163V12.69C27.1686 6.2449 21.855 1 15.3254 1C8.79585 1 3.48779 6.2449 3.48779 12.69V18.9163M24.0649 18.9163V12.69C24.0649 7.93292 20.1449 4.06364 15.3254 4.06364C10.506 4.06364 6.58601 7.93292 6.58601 12.69V18.9163"
          stroke="#2E3338"
          stroke-miterlimit="10"
        />
        <Path d="M30 19.2725H1V42.247H30V19.2725Z" stroke="#2E3338" stroke-miterlimit="10" />
        <Path
          d="M18.5567 28.9126C18.5567 30.354 17.5961 31.5762 16.2802 31.9927V35.8401H14.2925V31.9927C12.971 31.5817 12.016 30.3595 12.016 28.9126C12.016 27.126 13.4818 25.6846 15.2863 25.6846C17.0909 25.6846 18.5567 27.126 18.5567 28.9126Z"
          fill="#2E3338"
        />
      </Svg>
    )
  }
}
