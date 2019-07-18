import * as React from 'react'
import LazyLoad from 'react-lazyload'
import { Image, StyleSheet, Text, View } from 'react-native'
import shuffleSeed from 'shuffle-seed'
import teamList from 'src/about/team/team-list'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import AspectRatio from 'src/shared/AspectRatio'
import Responsive from 'src/shared/Responsive'
import { MENU_MAX_WIDTH } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  randomSeed: number
}

export class Team extends React.Component<Props & I18nProps> {
  render() {
    const { t, randomSeed } = this.props
    const shuffledTeamList = shuffleSeed.shuffle(teamList, randomSeed)

    return (
      <View style={styles.container}>
        <GridRow allStyle={standardStyles.centered}>
          <Cell span={Spans.half}>
            <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
              {t('coreContributors')}
            </H1>
            <H4 style={textStyles.center}>{t('InNoOrder')}</H4>
          </Cell>
        </GridRow>
        <View style={styles.maxWidth}>
          <View style={styles.photoList}>
            {shuffledTeamList.map((person) => (
              <Responsive key={person.name} medium={styles.mediumPerson} large={styles.largePerson}>
                <View style={styles.person}>
                  <LazyLoad height={200}>
                    <AspectRatio style={styles.photoContainer} ratio={275 / 400}>
                      <Image source={{ uri: person.photo }} style={styles.photo} />
                    </AspectRatio>
                  </LazyLoad>
                  <H4>{person.name}</H4>
                  <Text style={fonts.h5}>{(t(person.role) as string).toUpperCase()}</Text>
                </View>
              </Responsive>
            ))}
            <Responsive medium={styles.mediumFiller} large={styles.largeFiller}>
              <View style={styles.filler} />
            </Responsive>
            <Responsive medium={styles.mediumFiller} large={styles.largeFiller}>
              <View style={styles.filler} />
            </Responsive>
          </View>
        </View>
      </View>
    )
  }
}

// @ts-ignore
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  photoContainer: { marginBottom: 20 },
  photo: {
    height: '100%',
    width: '100%',
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    maxWidth: 1025,
  },
  header: {
    alignSelf: 'stretch',
    paddingBottom: 10,
    paddingLeft: 34,
  },
  maxWidth: {
    maxWidth: MENU_MAX_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  person: {
    flexDirection: 'column',
    margin: 5,
    width: 176,
    minHeight: 400,
  },
  mediumPerson: {
    flexDirection: 'column',
    margin: 20,
    width: 210,
    minHeight: 420,
  },
  largePerson: {
    flexDirection: 'column',
    margin: 30,
    width: 275,
  },
  filler: {
    width: 176 + 10,
    height: 0,
  },
  mediumFiller: {
    width: 210 + 40,
    height: 0,
  },
  largeFiller: {
    width: 275 + 60,
    height: 0,
  },
})

export default withNamespaces('about')(Team)
