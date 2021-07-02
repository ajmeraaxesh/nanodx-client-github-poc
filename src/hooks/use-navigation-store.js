import create from 'zustand'

const useNavbarStore = create(set => ({
  navigationLinks: [],
  updateNavigationLinks: links =>
    set({
      navigationLinks: links
        .map(link => ({...link, current: false}))
        .sort((a, b) => {
          const aSortOrder = a.sortOrder
          const bSortOrder = b.sortOrder
          return aSortOrder.localeCompare(bSortOrder)
        }),
    }),
  // Commented this method as using router.pathname in the App
  // Thereby avoiding multiple rendering of the component
  // The multiple rendering occurred because of the useEffect method in Dashboard which
  // calls the setCurrent

  // setCurrentLink: linkPath =>
  //   set(state => {
  //     const updatedNavigationLinkState = state.navigationLinks.map(link => ({
  //       ...link,
  //       current: linkPath.includes(link.path),
  //     }))
  //     return {
  //       navigationLinks: updatedNavigationLinkState,
  //     }
  //   }),
}))

export default useNavbarStore
