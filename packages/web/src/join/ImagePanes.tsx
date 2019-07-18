import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import AspectRatio from 'src/shared/AspectRatio'
import { fonts } from 'src/styles'

export default class ImagePanes extends React.PureComponent {
  render() {
    return (
      <GridRow>
        <Cell span={Spans.half} style={styles.cell}>
          <Fade>
            <View style={styles.frame}>
              <AspectRatio ratio={480 / 300}>
                <Image
                  style={styles.image}
                  resizeMode="cover"
                  source={{ uri: require('./will-teal-org.jpg') }}
                />
              </AspectRatio>
              <Text style={[fonts.h5, styles.caption]}>
                Applying distributed authority and decision-making with our Teal org design
              </Text>
            </View>
          </Fade>
          <Fade>
            <View style={styles.frame}>
              <AspectRatio ratio={480 / 300}>
                <Image
                  style={styles.image}
                  resizeMode="cover"
                  source={{ uri: require('./laurance-joe.jpg') }}
                />
              </AspectRatio>
              <Text style={[fonts.h5, styles.caption]}>
                Joe completing the Gold Book of Values, a reflection on wholeness
              </Text>
            </View>
          </Fade>
        </Cell>
        <Cell span={Spans.half} style={styles.cell}>
          <Fade>
            <View style={styles.frame}>
              <AspectRatio ratio={480 / 639}>
                <Image
                  style={styles.image}
                  resizeMode="cover"
                  source={{ uri: require('./connectionfun.jpg') }}
                />
              </AspectRatio>
              <Text style={[fonts.h5, styles.caption]}>
                Quarterly Celo retreat focusing on self, team, and company evolution
              </Text>
            </View>
          </Fade>
        </Cell>
      </GridRow>
    )
  }
}

const styles = StyleSheet.create({
  image: {
    height: '100%',
  },
  caption: {
    paddingTop: 5,
  },
  frame: {
    marginBottom: 20,
  },
  cell: {
    paddingVertical: 0,
  },
})
