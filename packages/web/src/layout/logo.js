import React from 'react'

export default ({ className }) => {
  return (
    <svg
      className={className.concat(' logo')}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 231.8 250"
    >
      <path
        d="M128.3,208c-45.8,0-83.1-37.3-83.1-83.1s37.3-83.1,83.1-83.1c33.7,0,52.8,16.4,65.7,37.9l16.7-46.4 c-21.8-19.6-50.8-31.6-82.5-31.6C60.1,1.7,4.9,56.9,4.9,125s55.2,123.3,123.3,123.3c31,0,59.4-11.5,81.1-30.4v-61 C193.8,195.4,165.5,208,128.3,208z"
        fill="currentColor"
      />
    </svg>
  )
}
