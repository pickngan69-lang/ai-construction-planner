import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AnalysisProvider } from './contexts/AnalysisContext'
import { ProjectProvider } from './contexts/ProjectContext'
import LoginPage from './pages/LoginPage'
import ContractorDashboard from './pages/ContractorDashboard'
import HouseCatalog from './pages/HouseCatalog'
import MultiProjectDashboard from './pages/MultiProjectDashboard'
import ProjectDetail from './pages/ProjectDetail'
import CustomerSummary from './pages/CustomerSummary'
import MaterialPrices from './pages/MaterialPrices'

// หน้าฝั่งผู้รับเหมาต้อง login ก่อน — ถ้ายังไม่ login แสดงหน้า LoginPage
function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <LoginPage />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalysisProvider>
          <ProjectProvider>
            <BrowserRouter>
              <Routes>
                {/* หน้าลูกค้า (Magic Link) — public เข้าได้โดยไม่ต้อง login */}
                <Route path="/shared/:id" element={<CustomerSummary />} />

                {/* หน้าฝั่งผู้รับเหมา — ต้อง login */}
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
                <Route
                  path="/materials"
                  element={
                    <RequireAuth>
                      <MaterialPrices />
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
