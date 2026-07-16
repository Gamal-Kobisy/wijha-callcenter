import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import ForgotPasswordPage from "./pages/forgotPasswordPage"
import AgentsPage from "./pages/AgentsPage"
import AgentPerformancePage from "./pages/AgentPerformancePage"
import ClientsPage from "./pages/ClientsPage"
import AccountPage from "./pages/AccountPage.tsx"
import { AuthProvider } from "@/contexts/AuthContext"
function App() {
  return (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />}  />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentPerformancePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
  )
}
export default App