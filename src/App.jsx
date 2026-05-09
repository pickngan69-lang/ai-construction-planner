import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnalysisProvider } from './contexts/AnalysisContext'
import LoginPage from './pages/LoginPage'
import ContractorDashboard from './pages/ContractorDashboard'
import HomeownerDashboard from './pages/HomeownerDashboard'
import { ROLES } from './utils/constants'

function RoleRouter() {
  const { user } = useAuth()
  if (!user) return <LoginPage />
  if (user.role === ROLES.CONTRACTOR) return <ContractorDashboard />
  if (user.role === ROLES.HOMEOWNER) return <HomeownerDashboard />
  return <LoginPage />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <RoleRouter />
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
