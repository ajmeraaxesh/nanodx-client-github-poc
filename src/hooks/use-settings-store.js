import create from 'zustand'

const useSettingstore = create(set => ({
  settings: {},
  updateSettings: newSettings =>
    set({
      settings: newSettings,
    }),
}))

export default useSettingstore
