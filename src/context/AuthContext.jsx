import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Decodifica el payload Base64 del token JWT emitido por el servidor
const decodificarJWT = (token) => {
  try {
    const payloadBase64 = token.split('.')[1];
    return JSON.parse(atob(payloadBase64));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(() => {
    const guardado = localStorage.getItem('tallerya_jwt_session');
    if (!guardado) return null;
    const parsed = JSON.parse(guardado);
    const payload = decodificarJWT(parsed.token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('tallerya_jwt_session');
      return null;
    }
    return parsed;
  });

  const login = async (email, password) => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || 'Credenciales incorrectas.');
    }

    const payload = decodificarJWT(data.access_token);
    const rol = email.toLowerCase().includes('admin') ? 'ADMIN' : 'MECANICO';

    const nuevaSesion = {
      token: data.access_token,
      email: payload.email,
      rol,
      expira: new Date(payload.exp * 1000).toLocaleTimeString('es-PE')
    };

    setSesion(nuevaSesion);
    localStorage.setItem('tallerya_jwt_session', JSON.stringify(nuevaSesion));
  };

  const logout = () => {
    setSesion(null);
    localStorage.removeItem('tallerya_jwt_session');
  };

  return (
    <AuthContext.Provider value={{ sesion, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);