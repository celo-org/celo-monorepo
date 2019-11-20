import hexRgba from 'hex-rgba'
import * as React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { brandStyles, GAP } from 'src/brandkit/common/constants'
import { colors, fonts, standardStyles } from 'src/styles'
import yiq from 'yiq'
import CopyIcon from 'src/icons/CopyIcon'
import Hoverable from 'src/shared/Hoverable'

export interface ColorData {
  hex: string
  cmyk: string
  name: string
}

interface State {
  justCopied: boolean
}

const MILLISECONDS = 5000

export default class PigmentState extends React.PureComponent<ColorData> {
  state: State = {
    justCopied: false,
  }

  onCopy = async () => {
    await onCopy(this.props.hex)
    this.setState({ justCopied: true })
    setTimeout(() => {
      this.setState({ justCopied: false })
    }, MILLISECONDS)
  }

  render() {
    const { hex, cmyk, name } = this.props
    return (
      <Pigment
        onCopyHex={this.onCopy}
        cmyk={cmyk}
        hex={hex}
        name={name}
        justCopied={this.state.justCopied}
      />
    )
  }
}

interface Props {
  onCopyHex: () => void
  justCopied: boolean
}

function Pigment({ hex, cmyk, name, onCopyHex, justCopied }: Props & ColorData) {
  const inline: ViewStyle = { backgroundColor: hex }

  if (hex === colors.white) {
    inline.borderColor = colors.gray
    inline.borderWidth = 1
  }

  const foreGround = getContrastingColor(hex) as colors

  return (
    <View style={[standardStyles.elementalMarginBottom]}>
      <Hoverable onPress={onCopyHex}>
        {(isHovering) => (
          <View style={[standardStyles.centered, styles.box]}>
            <View
              style={[
                standardStyles.centered,
                styles.pigment,
                styles.transitions,
                isHovering && styles.pigmentHover,
                inline,
              ]}
            >
              <View
                style={[
                  standardStyles.row,
                  styles.transitions,
                  styles.copy,
                  !justCopied && isHovering && styles.copyHover,
                ]}
              >
                <CopyIcon size={14} color={foreGround} />
                <Text style={[fonts.small, styles.copyText, { color: foreGround }]}>Copy</Text>
              </View>
              <Text
                style={[
                  styles.afterEffect,
                  fonts.small,
                  styles.copy,
                  justCopied && styles.copyHover,
                  styles.transitions,
                  { color: foreGround },
                ]}
              >
                Copied
              </Text>
            </View>
          </View>
        )}
      </Hoverable>
      <View style={brandStyles.gap}>
        <Text style={fonts.h5}>{name}</Text>
        <Text style={fonts.small}>{hex}</Text>
        <Text style={fonts.small}>{hexToHumanRGB(hex)}</Text>
        <Text style={fonts.small}>CMYK {cmyk}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  transitions: {
    transitionDuration: '500ms',
  },
  box: {
    cursor: 'copy',
    borderColor: colors.gray,
    borderWidth: 1,
    padding: 30,
    margin: GAP,
  },
  pigment: {
    height: 95,
    flexBasis: 95,
    width: 95,
    transitionProperty: 'transform',
  },
  pigmentHover: {
    transform: [{ scaleX: 1.05 }, { scaleY: 1.05 }],
  },
  copyText: {
    paddingLeft: 5,
  },
  copy: {
    opacity: 0,
    transitionProperty: 'opacity, transform',
  },
  copyHover: {
    opacity: 1,
    transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
  },
  afterEffect: { position: 'absolute' },
})

function hexToHumanRGB(hex: string) {
  return hexRgba(hex)
    .toUpperCase()
    .replace('A(', 'A (')
}

// function hexToMachineRGB(hex) {
//   const rgba = hexRgba(hex)
//   const [red, green, blue, alpha] = rgba
//     .replace('rgba(', '')
//     .replace(')', '')
//     .split(',')

//   return { red, green, blue }
// }

function getContrastingColor(hex: string) {
  return yiq(hex, { white: colors.white, black: colors.dark })
}

async function onCopy(text: string) {
  await navigator.clipboard.writeText(text)
}
