import * as React from 'react'
import { ImagePanes } from 'src/shared/ImagePanes'

const HALF = {
  source: { uri: require('./connectionfun.jpg') },
  caption: 'Celo retreat focusing on self, team, and ecosystem evolution',
}

const FIRST_QUARTER = {
  source: { uri: require('./will-teal-org.jpg') },
  caption: 'Applying distributed authority and decision-making with a Teal org design',
}

const SECOND_QUARTER = {
  source: { uri: require('./berlinOffice.jpg') },
  caption: 'Celo contributors in Berlin practicing Holocracy by going over project tensions',
}

export default function JoinImagePanes() {
  return <ImagePanes half={HALF} quarter={FIRST_QUARTER} secondQuarter={SECOND_QUARTER} />
}
