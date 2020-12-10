import Carousel from 'nuka-carousel'
import * as React from 'react'
import { View } from 'react-native'
import PagingDots from 'src/carousel/PagingDots'
import Fellow from 'src/community/connect/Fellow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, standardStyles } from 'src/styles'

const fellows = [
  {
    name: 'Xochitl Cazador',
    image: require('src/community/connect/fellow-xochitl@2x.jpg'),
    location: 'Mexico',
    role: ' Go-to-Market',
    color: colors.purpleScreen,
    quote:
      '“My grandparents were Mexican migrant farmers—I saw first hand how access to basic financial tools can change lives.”',
    text:
      'Xochitl recently graduated from Stanford Graduate School of Business. Prior to Stanford, she was a Director at Cisco where she led expansion into 26 Emerging Markets. She is leveraging her background and expertise to explore Mexico as a potential launch country for Celo. Her key activities include country landscaping, user research, pilot scoping and implementation, analysis and final recommendations.',
  },
  {
    name: 'Pratyush Ranjan Tiwari',
    image: require('src/community/connect/fellow-pratyush@2x.jpg'),
    location: 'India',
    role: 'Engineering',
    color: colors.purpleScreen,
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
    image: require('src/community/connect/fellow-james@2x.jpg'),
    location: 'Colombia',
    role: 'Experience',
    color: colors.purpleScreen,
    quote: '"I’ve spent my career running field operations under extreme financial circumstances.”',
    text:
      'James applied his skills as a Fixer to organize comprehensive field research for the entire cLabs team, interviewing 20 Venezuelan migrants in Colombia. The ethnographic interviews focused in particular on individual perspectives on the prolific informal remittance market and the process of becoming unbanked in the transition from Venezuela to Colombia. This immersive learning experience was instrumental in increasing empathy and understanding with our end users.',
  },
]

class FellowViewer extends React.PureComponent<ScreenProps> {
  componentDidMount() {
    // ensure the Carousel sizes correctly
    setImmediate(() => window.dispatchEvent(new Event('resize')))
  }

  render() {
    return (
      <View
        style={
          ScreenSizes.MOBILE === this.props.screen
            ? standardStyles.sectionMarginTopMobile
            : standardStyles.sectionMarginTop
        }
      >
        <Fade distance={'20px'}>
          <Carousel
            heightMode={'current'}
            autoplay={false}
            dragging={true}
            swiping={true}
            renderCenterLeftControls={null}
            renderCenterRightControls={null}
            renderBottomCenterControls={PagingDots}
          >
            {fellows.map((fellow) => (
              <Fellow key={fellow.name} {...fellow} />
            ))}
          </Carousel>
        </Fade>
      </View>
    )
  }
}

export default withScreenSize(FellowViewer)
