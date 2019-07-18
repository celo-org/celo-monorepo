import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H3, Ul } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles, textStyles } from 'src/styles'

interface BTNProps {
  title: string
  href: string
}

interface Props {
  title: string
  text: string
  label: string
  id: string
  children: React.ReactNode
  buttonOne: BTNProps
  buttonTwo: BTNProps
}

export default withScreenSize(
  React.memo(function StackSection(props: Props & ScreenProps) {
    const { title, text, buttonOne, buttonTwo, label, children } = props
    return (
      <Fade duration={500} bottom={true} distance="20px">
        <View>
          <span id={props.id} />
          <GridRow
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={[standardStyles.blockMarginBottomMobile, styles.mobile]}
          >
            <Cell span={Spans.fourth}>
              <Text style={[fonts.superLarge, textStyles.invert]}>{label}</Text>
            </Cell>
            <Cell span={Spans.half} style={styles.content}>
              <H3 style={[standardStyles.elementalMarginBottom, textStyles.invert]}>{title}</H3>
              <Text style={[fonts.p, textStyles.invert]}>{text}</Text>
              <Ul style={styles.list}>{children}</Ul>
            </Cell>
            <Cell
              span={Spans.fourth}
              style={props.screen === ScreenSizes.MOBILE && styles.buttonsMobile}
            >
              <Button
                text={buttonOne.title}
                kind={BTN.PRIMARY}
                size={SIZE.small}
                href={buttonOne.href}
                target={'blank'}
              />
              <View style={styles.separator} />
              <Button
                text={buttonTwo.title}
                kind={BTN.SECONDARY}
                size={SIZE.small}
                href={buttonTwo.href}
                target={'blank'}
                align="flex-start"
              />
            </Cell>
          </GridRow>
        </View>
      </Fade>
    )
  })
)

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  buttonArea: {
    alignItems: 'center',
    flex: 1,
  },
  separator: {
    marginVertical: 10,
  },
  mobile: {
    flexDirection: 'column',
  },
  list: {
    marginLeft: 10,
  },
  buttonsMobile: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
})
