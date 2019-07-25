import { useEffect } from 'react'
import { connect } from 'react-redux'
import { FeeType, updateDefaultFee as updateDefaultFeeAction } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'

interface DispatchProps {
  updateDefaultFee: typeof updateDefaultFeeAction
}

interface OwnProps {
  feeType: FeeType
}

type Props = DispatchProps & OwnProps

const mapDispatchToProps = {
  updateDefaultFee: updateDefaultFeeAction,
}

export function EstimateFee({ feeType, updateDefaultFee }: Props) {
  useEffect(
    () => {
      updateDefaultFee(feeType)
    },
    [feeType]
  )

  return null
}

export default connect<{}, DispatchProps, OwnProps, RootState>(
  null,
  mapDispatchToProps
)(EstimateFee)
