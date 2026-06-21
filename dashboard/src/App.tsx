import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import LoginPage from './routes/login'
import DashboardLayout from './routes/dashboard-layout'
import ProvidersPage from './routes/providers'
import PersonalityPage from './routes/personality'
import TunnelPage from './routes/tunnel'
import OverviewPage from './routes/overview'
import CombosPage from './routes/combos'
import ChatPage from './routes/chat'
import SkillsPage from './routes/skills'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    function handleStorage() { setToken(localStorage.getItem('token')) }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function onLogin(t: string) {
    localStorage.setItem('token', t)
    setToken(t)
  }

  function onLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  function openChat() {
    window.location.href = '/chat'
  }

  return (
    <Routes>
      <Route path="chat" element={<ChatPage />} />
      {!token ? (
        <>
          <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route element={<DashboardLayout onLogout={onLogout} />}>
            <Route index element={<OverviewPage />} />
            <Route path="providers" element={<ProvidersPage />} />
            <Route path="personality" element={<PersonalityPage />} />
            <Route path="tunnel" element={<TunnelPage />} />
            <Route path="combos" element={<CombosPage />} />
            <Route path="skills" element={<SkillsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  )
}
