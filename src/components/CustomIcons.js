const PngIcon = ({title, className}) => {
  switch (title) {
    case 'Users':
      return <img src="/images/users.png" className={className} alt={title} />
    case 'Systems':
      return <img src="/images/systems.png" className={className} alt={title} />
    case 'Tests':
      return <img src="/images/tests.png" className={className} alt={title} />
    case 'QC':
      return <img src="/images/qc.png" className={className} alt={title} />
    case 'Reports':
      return <img src="/images/reports.png" className={className} alt={title} />
    case 'Settings':
      return (
        <img src="/images/settings.png" className={className} alt={title} />
      )
    case 'Locations':
      return (
        <img src="/images/locations.png" className={className} alt={title} />
      )

    default:
      return null
  }
}

export const NavigationIcons = ({title, className, boxSize}) => {
  return <PngIcon title={title} className={className} />
}
