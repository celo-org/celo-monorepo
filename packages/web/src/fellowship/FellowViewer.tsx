import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Fellow from 'src/fellowship/Fellow'
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN } from 'src/shared/Button.3'
import BookLayout from 'src/layout/BookLayout'
import { withNamespaces, NameSpaces, I18nProps } from 'src/i18n'

const fellows = [
  {
    name: 'Xochitl Cazador',
    image: require('src/fellowship/fellow-xochitl@2x.jpg'),
    location: 'Mexico',
    role: ' Go-to-Market',
    quote:
      '“My grandparents were Mexican migrant farmers—I saw first hand how access to basic financial tools can save lives.”',
    text:
      'Xochitl recently graduated from Stanford Graduate School of Business. Prior to Stanford, she was a Director at Cisco where she led expansion into 26 Emerging Markets. She is leveraging her background and expertise to explore Mexico as a potential launch country for Celo. Her key activities include country landscaping, user research, pilot scoping and implementation, analysis and final recommendations.',
  },
  {
    name: 'Pratyush Ranjan Tiwari',
    image: require('src/fellowship/fellow-pratyush@2x.jpg'),
    location: 'India',
    role: 'Engineering',
    quote:
      '“As part of my thesis, I explored how to successfully maintain user privacy as we move to decentralized financial systems.”',
    text: (
      <>
        Pratyush wrote a technical paper describing an efficient Zero Knowledge Protocol and
        possible implementation libraries for{' '}
        <Button
          kind={BTN.INLINE}
          text={'EigenTrust'}
          href={'https://en.wikipedia.org/wiki/EigenTrust'}
          target="_new"
        />{' '}
        Computation. His fellowship built on the work of Celo co-founder{' '}
        <Button
          kind={BTN.INLINE}
          text={'Sep Kamvar'}
          href={'https://en.wikipedia.org/wiki/Sepandar_Kamvar'}
          target="_new"
        />
        , who developed EigenTrust.
      </>
    ),
  },
  {
    name: 'James Downer',
    image: require('src/fellowship/fellow-james@2x.jpg'),
    location: 'Colombia',
    role: 'Experience',
    quote: '"I’ve spent my career running field operations under extreme financial circumstances.”',
    text:
      'James applied his skills as a Fixer to organize comprehensive field research for the entire C Labs team, interviewing 20 Venezuelan migrants in Colombia. The ethnographic interviews focused in particular on individual perspectives on the prolific informal remittance market and the process of becoming unbanked in the transition from Venezuela to Colombia. This immersive learning experience was instrumental in increasing empathy and understanding with our end users.',
  },
]

class FellowViewer extends React.PureComponent<ScreenProps & I18nProps> {
  render() {
    return (
      <BookLayout startBlock={true} isWide={true} label={this.props.t('fellowShowcaseLabel')}>
        <View>
          {fellows.map((fellow, index) => (
            <Fellow key={fellow.name} {...fellow} flip={index % 2 === 1} />
          ))}
        </View>
      </BookLayout>
    )
  }
}

export default withNamespaces(NameSpaces.fellowship)(withScreenSize(FellowViewer))
