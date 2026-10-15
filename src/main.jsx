import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth'
import RequireAuth from './RequireAuth'
import Home from './pages/Home'
import Tv from './pages/Tv'
import Phone from './pages/Phone'
import PhoneTitle from './pages/PhoneTitle'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tv" element={<RequireAuth variant="tv"><Tv /></RequireAuth>} />
          <Route path="/phone" element={<RequireAuth variant="phone"><Phone /></RequireAuth>} />
          <Route path="/phone/title/:id" element={<RequireAuth variant="phone"><PhoneTitle /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
