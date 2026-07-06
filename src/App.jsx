import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnalysisProvider } from './contexts/AnalysisContext'
import LoginPage from './pages/LoginPage'
import ContractorDashboard from './pages/ContractorDashboard'
import HouseCatalog from './pages/HouseCatalog'
import MultiProjectDashboard from './pages/MultiProjectDashboard'

// Contractor-only app. Once logged in, the pages are navigable via react-router.
function AppRouter() {
  const { user } = useAuth()
  if (!user) return <LoginPage />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ContractorDashboard />} />
        <Route path="/catalog" element={<HouseCatalog />} />
        <Route path="/projects" element={<MultiProjectDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <AppRouter />
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
