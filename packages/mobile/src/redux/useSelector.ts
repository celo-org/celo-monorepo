import { TypedUseSelectorHook, useSelector } from 'react-redux'
import { RootState } from 'src/redux/reducers'

// useSelector hook that is properly typed for our store's root state
const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector

export default useTypedSelector
