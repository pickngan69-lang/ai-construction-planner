import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AnalysisProvider } from './contexts/AnalysisContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AccountBillingPage from './features/billing/AccountBillingPage'
import CheckoutSuccessPage from './features/billing/CheckoutSuccessPage'
import PricingPage from './features/billing/PricingPage'
import MemberLoginPage from './features/auth/MemberLoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ContractorDashboard from './pages/ContractorDashboard'
import CustomerSummary from './pages/CustomerSummary'
import HouseCatalog from './pages/HouseCatalog'
import HousePlanDetail from './pages/HousePlanDetail'
import MaterialPrices from './pages/MaterialPrices'
import MultiProjectDashboard from './pages/MultiProjectDashboard'
import ProjectDetail from './pages/ProjectDetail'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <MemberLoginPage />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <ProjectProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/member/login" element={<MemberLoginPage />} />
                <Route path="/account/billing" element={<AccountBillingPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/shared/:id" element={<CustomerSummary />} />

                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <ContractorDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/catalog"
                  element={
                    <RequireAuth>
                      <HouseCatalog />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/catalog/:id"
                  element={
                    <RequireAuth>
                      <HousePlanDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/materials"
                  element={
                    <RequireAuth>
                      <MaterialPrices />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <RequireAuth>
                      <MultiProjectDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/project/:id"
                  element={
                    <RequireAuth>
                      <ProjectDetail />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ProjectProvider>
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App