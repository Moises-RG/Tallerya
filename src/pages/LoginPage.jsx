import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@tallerya.pe');
  const [password, setPassword] = useState('Admin1234');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email.trim(), password);
      navigate('/taller');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container py-4">
        <div className="card mx-auto" style={{ maxWidth: '390px' }}>
          <div className="card-header bg-white fw-bold">
            Ingreso Personal del Taller (JWT)
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small">Correo corporativo</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small">Contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={cargando} className="btn btn-primary btn-sm w-100">
                {cargando ? 'Validando token JWT...' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="border-top mt-3 pt-2 small text-muted">
              <div><strong>Usuarios registrados:</strong></div>
              <div>Admin: <code>admin@tallerya.pe</code> / <code>Admin1234</code></div>
              <div>Mecánico: <code>mecanico@tallerya.pe</code> / <code>Mecanico1234</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}