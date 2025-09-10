import { Routes, Route } from 'react-router-dom'
import './App.css'
import Register from './components/Register'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import DonorDashboard from './components/DonorDashboard'
import PatientDashboard from './components/PatientDashboard'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </div>
  )
}

export default App
