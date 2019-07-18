import * as React from 'react'
import { Image } from 'react-native'

export enum LogoTypes {
  COLOR = 'COLOR',
  WHITE = 'WHITE',
}

interface Props {
  height?: number
  type?: LogoTypes
}

// const VIEW_BOX = 41

export default class Logo extends React.PureComponent<Props> {
  static defaultProps = {
    height: 50,
    type: LogoTypes.COLOR,
  }

  render() {
    const { type } = this.props
    const src =
      type === LogoTypes.WHITE
        ? require('src/images/white-wallet-rings.png')
        : require('src/images/coins-logo.png')
    return (
      // TODO(cmcewen) make rn-svg support mix-blend-mode :(
      // <Svg
      //   width={this.props.height}
      //   height={this.props.height}
      //   viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
      //   fill="none"
      //   xmlns="http://www.w3.org/2000/svg"
      // >
      //   <G style="mix-blend-mode: multiply;" transform="translate(0 6.68176)">
      //     <Path
      //       d="M16.614 33.3183C12.1896 33.3183 8.03611 31.6027 4.87584 28.4424C-1.62528 21.9413 -1.62528 11.377 4.87584 4.87584C8.03611 1.71557 12.1896 1.72221e-07 16.614 1.72221e-07C21.0384 1.72221e-07 25.1919 1.71557 28.3521 4.87584C31.5124 8.03611 33.228 12.1896 33.228 16.614C33.228 21.0384 31.5124 25.1919 28.3521 28.3521C25.2821 31.6027 21.0384 33.3183 16.614 33.3183ZM16.614 4.33408C13.2731 4.33408 10.2032 5.59819 7.85552 7.94582C3.06997 12.7314 3.06997 20.5869 7.85552 25.3724C10.2032 27.7201 13.2731 28.9842 16.614 28.9842C19.9548 28.9842 23.0248 27.7201 25.3724 25.3724C27.7201 23.0248 28.9842 19.9548 28.9842 16.614C28.9842 13.2731 27.7201 10.2032 25.3724 7.85552C23.0248 5.68848 19.9548 4.33408 16.614 4.33408Z"
      //       fill={Colors.GOLD}
      //     />
      //   </G>
      //   <G style="mix-blend-mode: multiply;" transform="translate(7.67285)">
      //     <Path
      //       d="M16.614 33.3183C12.3702 33.3183 8.1264 31.693 4.87584 28.4424C-1.62528 21.9413 -1.62528 11.377 4.87584 4.87584C11.377 -1.62528 21.9413 -1.62528 28.4424 4.87584C34.9435 11.377 34.9435 21.9413 28.4424 28.4424C25.1016 31.693 20.8578 33.3183 16.614 33.3183ZM16.614 4.33408C13.4537 4.33408 10.2934 5.5079 7.85553 7.94582C3.06998 12.7314 3.06998 20.5869 7.85553 25.3724C12.6411 30.158 20.4966 30.158 25.2821 25.3724C30.0677 20.5869 30.0677 12.7314 25.2821 7.94582C22.9345 5.59819 19.7743 4.33408 16.614 4.33408Z"
      //       fill={Colors.PRIMARY}
      //     />
      //   </G>
      // </Svg>

      <Image
        source={src}
        style={{ width: this.props.height, height: this.props.height }}
        resizeMode="contain"
      />
    )
  }
}
