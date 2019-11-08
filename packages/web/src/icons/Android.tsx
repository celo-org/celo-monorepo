import * as React from 'react'
import { colors } from 'src/styles'
import Svg, { ClipPath, Defs, G, Path, Rect } from 'svgs'

interface Props {
  size: number
  color?: colors
}

export default React.memo(function Android({ size, color }: Props) {
  const fill = color || 'white'
  return (
    <Svg width={size} height={size} viewBox="0 0 19 22" fill="none">
      <G clipPath="url(#clip0)">
        <Path
          d="M1.75602 7.33545C1.03284 7.33545 0.457397 7.91089 0.457397 8.63406V14.0433C0.457397 14.7665 1.03284 15.3419 1.75602 15.3419C2.47919 15.3419 3.05463 14.7665 3.05463 14.0433V8.63406C3.05463 7.91089 2.47919 7.33545 1.75602 7.33545ZM16.9019 7.33545C16.1787 7.33545 15.6033 7.91089 15.6033 8.63406V14.0433C15.6033 14.7665 16.1787 15.3419 16.9019 15.3419C17.6251 15.3419 18.2005 14.7665 18.2005 14.0433V8.63406C18.2005 7.91089 17.6251 7.33545 16.9019 7.33545Z"
          fill={fill}
        />
        <Path
          d="M7.16532 13.5083C6.44214 13.5083 5.8667 14.0837 5.8667 14.8069V20.2162C5.8667 20.9393 6.44214 21.5148 7.16532 21.5148C7.88849 21.5148 8.46393 20.9393 8.46393 20.2162V14.8069C8.46393 14.0837 7.88849 13.5083 7.16532 13.5083ZM11.4927 13.5083C10.7695 13.5083 10.1941 14.0837 10.1941 14.8069V20.2162C10.1941 20.9393 10.7695 21.5148 11.4927 21.5148C12.2159 21.5148 12.7913 20.9393 12.7913 20.2162V14.8069C12.7913 14.0837 12.2159 13.5083 11.4927 13.5083Z"
          fill={fill}
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.64586 0.543893C5.67406 0.528263 5.70266 0.520342 5.73336 0.520029C5.79908 0.519398 5.86137 0.55223 5.89643 0.615486L6.82317 2.28599C7.58127 1.94972 8.4316 1.76098 9.32892 1.76098C10.2262 1.76098 11.0766 1.94972 11.8347 2.28599L12.7614 0.615486C12.7965 0.55223 12.8588 0.519394 12.9245 0.520029C12.9552 0.520321 12.9838 0.528263 13.012 0.543893C13.1046 0.595223 13.135 0.701633 13.0836 0.794469L12.1688 2.44707C13.9288 3.36287 15.1176 5.10324 15.12 7.10062H3.53784C3.54022 5.10324 4.72903 3.36287 6.48906 2.44707L5.57427 0.794469C5.52281 0.701633 5.55326 0.595223 5.64586 0.543893ZM3.53784 15.9523V7.55802H15.12V15.9523C15.12 16.7279 14.4956 17.3523 13.72 17.3523H4.93788C4.16226 17.3523 3.53784 16.7279 3.53784 15.9523ZM6.17285 4.49743C6.17285 4.23303 6.3917 4.01417 6.6561 4.01417C6.9205 4.01417 7.13935 4.23303 7.13935 4.49743C7.13935 4.76183 6.9205 4.98069 6.6561 4.98069C6.3917 4.98069 6.17285 4.76183 6.17285 4.49743ZM11.5185 4.49743C11.5185 4.23303 11.7373 4.01417 12.0017 4.01417C12.2661 4.01417 12.485 4.23303 12.485 4.49743C12.485 4.76183 12.2661 4.98069 12.0017 4.98069C11.7373 4.98069 11.5185 4.76183 11.5185 4.49743Z"
          fill={fill}
        />
      </G>
      <Defs>
        <ClipPath id="clip0">
          <Rect width="18.711" height="22" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  )
})
