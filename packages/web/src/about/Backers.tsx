import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import backerList from 'src/about/backers/backers'
import { I18nProps, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { hashNav } from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { fonts, standardStyles, textStyles } from 'src/styles'

export class Backers extends React.Component<I18nProps & ScreenProps> {
  render() {
    const { t, screen } = this.props

    return (
      <>
        <BookLayout startBlock={true} label={t('celoBackers')} nativeID={hashNav.about.backers}>
          <Text style={fonts.p}>{t('celoBackersText', { count: 80 })}</Text>
        </BookLayout>
        <GridRow
          allStyle={standardStyles.blockMarginTopTablet}
          desktopStyle={[styles.backerContainer, standardStyles.sectionMarginBottom]}
          tabletStyle={[styles.backerContainer, standardStyles.sectionMarginBottomTablet]}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
        >
          <Cell span={Spans.full} tabletSpan={Spans.full}>
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
    height: 60,
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
