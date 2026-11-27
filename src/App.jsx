import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardTaller from './pages/DashboardTaller';
import CotizacionPublica from './pages/CotizacionPublica';

const RutaProtegida = ({ children }) => {
  const { sesion } = useAuth();
  return sesion ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cotizacion/:id" element={<CotizacionPublica />} />
          <Route
            path="/taller"
            element={
              <RutaProtegida>
                <DashboardTaller />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}