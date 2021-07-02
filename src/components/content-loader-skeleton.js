import React from 'react'
import ContentLoader from 'react-content-loader'

const MyLoader = props => (
  <ContentLoader
    speed={2}
    width={680}
    height={84}
    viewBox="0 0 680 84"
    backgroundColor="#000000"
    foregroundColor="#9a244f"
    {...props}
  >
    <rect x="0" y="0" rx="3" ry="3" width="67" height="11" />
    <rect x="84" y="-3" rx="0" ry="0" width="4" height="14" />
    <rect x="103" y="0" rx="3" ry="3" width="67" height="11" />
    <rect x="204" y="0" rx="3" ry="3" width="67" height="11" />
    <rect x="186" y="-3" rx="0" ry="0" width="4" height="14" />
    <rect x="303" y="0" rx="3" ry="3" width="67" height="11" />
    <rect x="285" y="-3" rx="0" ry="0" width="4" height="14" />
  </ContentLoader>
)

export default MyLoader
