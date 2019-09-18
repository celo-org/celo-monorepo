import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { startBalanceAutorefresh, stopBalanceAutorefresh } from 'src/home/actions'

export default function useBalanceAutoRefresh() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(startBalanceAutorefresh())

    return () => {
      dispatch(stopBalanceAutorefresh())
    }
  }, [])
}
