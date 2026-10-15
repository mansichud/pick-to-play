import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth'
import RequireAuth from './RequireAuth'
import Home from './pages/Home'
import Tv from './pages/Tv'
import Phone from './pages/Phone'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tv" element={<RequireAuth variant="tv"><Tv /></RequireAuth>} />
          <Route path="/phone" element={<RequireAuth variant="phone"><Phone /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
