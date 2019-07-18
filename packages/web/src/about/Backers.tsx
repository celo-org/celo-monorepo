import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import backerList from 'src/about/backers/backers'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Responsive from 'src/shared/Responsive'
import { TextStyles } from 'src/shared/Styles'
export const BACKER_ID = 'backers'
import { H1, H4 } from 'src/fonts/Fonts'
import Button, { BTN } from 'src/shared/Button.3'
import { fonts, standardStyles, textStyles } from 'src/styles'

export class Backers extends React.Component<I18nProps> {
  render() {
    const { t } = this.props

    return (
      <>
        <GridRow allStyle={standardStyles.centered}>
          <Cell span={Spans.three4th}>
            <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]} id={BACKER_ID}>
              {t('celoBackers')}
            </H1>
            <H4 style={textStyles.center}>{t('celoBackersText')}</H4>
          </Cell>
        </GridRow>
        <GridRow>
          <Cell span={Spans.full}>
            <View style={styles.photoList}>
              {backerList.map((backer) => (
                <Responsive
                  key={backer.name}
                  medium={styles.mediumPerson}
                  large={styles.largePerson}
                >
                  <View style={styles.person}>
                    {backer.photo ? (
                      <Image
                        resizeMode={'contain'}
                        source={{ uri: backer.photo }}
                        style={styles.photo}
                      />
                    ) : (
                      <Responsive medium={[TextStyles.mediumMain, styles.centerText]}>
                        <Text style={[TextStyles.small, styles.centerText]}>{backer.name}</Text>
                      </Responsive>
                    )}
                  </View>
                </Responsive>
              ))}
            </View>
          </Cell>
        </GridRow>
        <GridRow
          desktopStyle={standardStyles.sectionMargin}
          tabletStyle={standardStyles.sectionMarginTablet}
          mobileStyle={standardStyles.sectionMarginMobile}
        >
          <Cell span={Spans.full}>
            <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]} id={BACKER_ID}>
              {t('Press and Media')}
            </H1>
            <Text style={[fonts.p, textStyles.center]}>
              {t('pressText')}{' '}
              <Button kind={BTN.INLINE} text={'press@celo.org'} href="mailto:press@celo.org" />.
            </Text>
          </Cell>
        </GridRow>
      </>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  photo: {
    height: 40,
    width: '100%',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  header: {
    alignSelf: 'stretch',
    paddingTop: 100,
    paddingBottom: 40,
    paddingLeft: 50,
  },
  maxWidth: {
    maxWidth: 1025,
  },
  person: {
    flexDirection: 'column',
    margin: 25,
    width: 200,
  },
  mediumPerson: {
    flexDirection: 'column',
    margin: 35,
    width: 220,
  },
  largePerson: {
    flexDirection: 'column',
    margin: 45,
    width: 240,
  },
  centerText: {
    textAlign: 'center',
  },
  headerPadding: {
    paddingLeft: 20,
  },
  pressLink: {
    cursor: 'pointer',
  },
  pressSpace: {
    marginTop: 10,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  idPaddingReduce: {
    paddingTop: 20,
  },
  idPaddingIncrease: {
    paddingTop: 80,
  },
})

export default withNamespaces('about')(Backers)
