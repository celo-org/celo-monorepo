import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import backerList from 'src/about/backers/backers'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import { hashNav } from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { fonts, textStyles } from 'src/styles'
import { withScreenSize, ScreenProps, ScreenSizes } from 'src/layout/ScreenSize'

export class Backers extends React.Component<I18nProps & ScreenProps> {
  render() {
    const { t, screen } = this.props

    return (
      <>
        <SideTitledSection
          title={t('celoBackers')}
          nativeID={hashNav.about.backers}
          text={t('celoBackersText')}
        />
        <GridRow desktopStyle={styles.backerContainer}>
          <Cell span={Spans.three4th} tabletSpan={Spans.full}>
            <View
              style={[styles.photoList, screen === ScreenSizes.DESKTOP && styles.photoListDesktop]}
            >
              {backerList.map((backer) => (
                <Responsive
                  key={backer.name}
                  medium={styles.mediumBacker}
                  large={styles.largeBacker}
                >
                  <View style={styles.backer}>
                    {backer.photo ? (
                      <Image
                        resizeMode={'contain'}
                        source={{ uri: backer.photo }}
                        style={styles.photo}
                      />
                    ) : (
                      <Text style={[fonts.h4, styles.name, textStyles.center]}>{backer.name}</Text>
                    )}
                  </View>
                </Responsive>
              ))}
            </View>
          </Cell>
        </GridRow>
      </>
    )
  }
}

const styles = StyleSheet.create({
  backerContainer: { justifyContent: 'flex-end' },
  photo: {
    height: 40,
    width: '100%',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoListDesktop: {
    justifyContent: 'space-between',
  },
  backer: {
    flexDirection: 'column',
    width: 176,
    marginVertical: 25,
    marginHorizontal: 5,
  },
  mediumBacker: {
    flexDirection: 'column',
    width: 220,
    margin: 20,
  },
  largeBacker: {
    flexDirection: 'column',
    marginHorizontal: 5,
    marginVertical: 30,
    width: 210,
  },
  name: {
    fontSize: 22,
  },
})

export default withScreenSize(withNamespaces('about')(Backers))
