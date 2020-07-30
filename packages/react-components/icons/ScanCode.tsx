import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  color?: string
}

export default class ScanCode extends React.PureComponent<Props> {
  static defaultProps = {
    color: colors.celoGreen,
  }

  render() {
    const { color } = this.props
    return (
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        width={20}
        height={16}
        viewBox="0 0 20 16"
        fill="none"
      >
        <Path
          fill={color}
          d="M9.61121 5.66381C11.2646 5.66381 12.6101 7.00931 12.6101 8.66272C12.6101 10.3161 11.2646 11.6616 9.61121 11.6616C7.95779 11.6616 6.6123 10.3161 6.6123 8.66272C6.6123 7.00931 7.95779 5.66381 9.61121 5.66381ZM9.61121 4.32501C7.21543 4.32501 5.2735 6.26694 5.2735 8.66272C5.2735 11.0585 7.21543 13.0004 9.61121 13.0004C12.007 13.0004 13.9489 11.0585 13.9489 8.66272C13.9489 6.26694 12.0063 4.32501 9.61121 4.32501Z"
        />
        <Path
          fill={color}
          d="M11.827 1.32541C12.0064 1.32541 12.175 1.4044 12.2895 1.5423L13.9664 3.55318C14.4028 4.07665 15.0434 4.37654 15.7249 4.37654H17.304C17.636 4.37654 17.9065 4.64697 17.9065 4.979V14.0721C17.9065 14.4041 17.636 14.6746 17.304 14.6746H1.92787C1.59585 14.6746 1.32541 14.4041 1.32541 14.0721V4.979C1.32541 4.64697 1.59585 4.37654 1.92787 4.37654H3.50699C4.18844 4.37654 4.82905 4.07665 5.2655 3.55318L6.94235 1.5423C7.05749 1.4044 7.22617 1.32541 7.4049 1.32541H11.827V1.32541ZM11.827 0H7.40423C6.8319 0 6.28968 0.253703 5.92352 0.693498L4.24734 2.70438C4.06393 2.92394 3.79282 3.05113 3.50699 3.05113H1.92787C0.862857 3.05113 0 3.91398 0 4.979V14.0721C0 15.1371 0.862857 16 1.92787 16H17.304C18.369 16 19.2319 15.1371 19.2319 14.0721V4.979C19.2319 3.91398 18.369 3.05113 17.304 3.05113H15.7249C15.439 3.05113 15.1679 2.92394 14.9845 2.70438L13.3077 0.693498C12.9415 0.253703 12.3993 0 11.827 0Z"
        />
      </Svg>
    )
  }
}
