import { Routes, Route } from 'react-router-dom'
import './App.css'
import Register from './components/Register'
import Login from './components/Login'
import LandingPage from './components/LandingPage'

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </div>
  )
}

export default App
