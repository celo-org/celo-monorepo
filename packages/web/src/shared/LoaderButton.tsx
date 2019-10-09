import Button, { ButtonsProps } from 'src/shared/Button.3'
import Spinner from 'src/shared/Spinner'
import { colors } from 'src/styles'

interface Props {
  isLoading: boolean
  spinnerColor: colors.white | colors.primary | colors.dark
}

export default function LoaderButton(props: ButtonsProps & Props) {
  const text = props.isLoading ? '' : props.text

  const iconLeft = props.isLoading ? (
    <Spinner size="small" color={props.spinnerColor} />
  ) : (
    props.iconLeft
  )
  return (
    // @ts-ignore since not all props work on all buttons kinds there is an error but we can ignore it as we Loader Button Props are typed.
    <Button
      align={props.align}
      disabled={props.isLoading || props.disabled}
      href={props.href}
      iconLeft={iconLeft}
      iconRight={props.iconRight}
      kind={props.kind}
      onPress={props.onPress}
      target={props.target}
      text={text}
    />
  )
}
