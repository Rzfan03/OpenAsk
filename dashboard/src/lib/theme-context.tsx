import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type Settings } from './api'

interface ThemeContextType {
  themeMode: 'dark' | 'light'
  themeAccent: string
  avatarUrl: string
  setThemeMode: (mode: 'dark' | 'light') => void
  setThemeAccent: (accent: string) => void
  setAvatarUrl: (url: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  themeAccent: 'indigo',
  avatarUrl: '',
  setThemeMode: () => {},
  setThemeAccent: () => {},
  setAvatarUrl: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('themeMode') as 'dark' | 'light') || 'dark'
  })
  const [themeAccent, setThemeAccentState] = useState(() => {
    return localStorage.getItem('themeAccent') || 'indigo'
  })
  const [avatarUrl, setAvatarUrlState] = useState('')

  function fetchSettings() {
    api.getSettings().then((s: Settings) => {
      if (s.themeMode) setThemeModeState(s.themeMode as 'dark' | 'light')
      if (s.themeAccent) setThemeAccentState(s.themeAccent)
      if (s.avatarUrl) setAvatarUrlState(s.avatarUrl)
    }).catch(() => {})
  }

  useEffect(() => { fetchSettings() }, [])

  useEffect(() => {
    function onFocus() { fetchSettings() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function setThemeMode(mode: 'dark' | 'light') {
    setThemeModeState(mode)
    localStorage.setItem('themeMode', mode)
    api.updateSettings({ themeMode: mode } as any).catch(() => {})
  }

  function setThemeAccent(accent: string) {
    setThemeAccentState(accent)
    localStorage.setItem('themeAccent', accent)
    api.updateSettings({ themeAccent: accent } as any).catch(() => {})
  }

  function setAvatarUrl(url: string) {
    setAvatarUrlState(url)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    document.documentElement.classList.toggle('light', themeMode === 'light')
  }, [themeMode])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', themeAccent)
  }, [themeAccent])

  return (
    <ThemeContext.Provider value={{ themeMode, themeAccent, avatarUrl, setThemeMode, setThemeAccent, setAvatarUrl }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
