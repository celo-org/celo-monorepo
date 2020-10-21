import { useState } from 'react'

export function useBooleanToggle(): [boolean, () => void] {
  const [isOn, setOn] = useState(false)

  function toggle() {
    return setOn(!isOn)
  }

  return [isOn, toggle]
}
