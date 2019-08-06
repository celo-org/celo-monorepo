import { useEffect } from 'react'
import { connect } from 'react-redux'
import { estimateFee as estimateFeeAction, FeeType } from 'src/fees/actions'
import { RootState } from 'src/redux/reducers'

interface DispatchProps {
  estimateFee: typeof estimateFeeAction
}

interface OwnProps {
  feeType: FeeType
}

type Props = DispatchProps & OwnProps

const mapDispatchToProps = {
  estimateFee: estimateFeeAction,
}

export function EstimateFee({ feeType, estimateFee }: Props) {
  useEffect(() => {
    estimateFee(feeType)
  }, [feeType])

  return null
}

export default connect<{}, DispatchProps, OwnProps, RootState>(
  null,
  mapDispatchToProps
)(EstimateFee)
