import * as React from 'react'
import microWork from 'src/home/earn-micro-work.jpg'
import growingBusiness from 'src/home/growing-business.jpg'
import mexico from 'src/home/prosper-mexico.jpg'
import { ImagePanes } from 'src/shared/ImagePanes'

const HALF = {
  source: { uri: growingBusiness },
  caption: 'Growing businesses with the Celo Platform in the Philippines',
}

const FIRST_QUARTER = {
  source: { uri: mexico },
  caption: 'Developing innovative ideas to help their communities prosper in Mexico',
}

const SECOND_QUARTER = {
  source: { uri: microWork },
  caption: 'Earning Celo Dollars via microwork in Kenya',
}

export default function JoinImagePanes() {
  return (
    <ImagePanes half={HALF} quarter={FIRST_QUARTER} secondQuarter={SECOND_QUARTER} reverse={true} />
  )
}
