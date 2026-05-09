import { createContext, useContext } from 'react'
import { useAnalysis } from '../hooks/useAnalysis'

const AnalysisContext = createContext(null)

export function AnalysisProvider({ children }) {
  const value = useAnalysis()
  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysisContext() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysisContext must be used inside AnalysisProvider')
  return ctx
}
