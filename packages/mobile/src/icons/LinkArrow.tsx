import * as React from 'react'
import { Image } from 'react-native'

const LinkArrow = () => {
  return <Image source={require('src/images/link-arrow.png')} style={{ width: 32, height: 32 }} />
}

export default React.memo(LinkArrow)
