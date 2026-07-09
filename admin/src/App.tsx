import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import ForgotPasswordPage from "./pages/forgotPasswordPage"
import AgentsPage from "./pages/AgentsPage"
import AgentPerformancePage from "./pages/AgentPerformancePage"
import ClientsPage from "./pages/ClientsPage"
import AccountPage from "./pages/AccountPage.tsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />}  />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentPerformancePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        {/*<Route path="/account/:id" element={<AccountPage />} />*/}
        <Route path="/account" element={<AccountPage/>} />
      </Routes>
    </BrowserRouter>
  )
}
export default App