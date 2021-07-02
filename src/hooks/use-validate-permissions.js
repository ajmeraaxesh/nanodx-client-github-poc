import useNavbarStore from '@hooks/use-navigation-store'

const useValidatePermissions = controlName => {
  const navigationLinks = useNavbarStore(state => state.navigationLinks)
  const filteredLink = navigationLinks.filter(
    link => link.controlName === controlName,
  )[0]
  // console.log('NavStore:: ', navigationLinks, {controlName}, {filteredLink})

  if (!filteredLink) {
    return {
      userScreenAccess: false,
      edit: false,
      add: false,
      delete: false,
    }
  }

  return {
    userScreenAccess: true,
    edit: filteredLink.edit,
    add: filteredLink.add,
    delete: filteredLink.delete,
  }
}

export default useValidatePermissions
