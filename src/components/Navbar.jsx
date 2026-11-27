import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { sesion, logout } = useAuth();
  const navigate = useNavigate();

  const handleSalir = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-light bg-white border-bottom mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold mb-0" to="/">
          TallerYa <small className="text-muted fw-normal">| Gestión Automotriz</small>
        </Link>

        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            Inicio
          </Link>

          {sesion ? (
            <>
              <Link to="/taller" className="btn btn-primary btn-sm">
                Panel ({sesion.rol})
              </Link>
              <button onClick={handleSalir} className="btn btn-outline-danger btn-sm">
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-dark btn-sm">
              Acceso Taller
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}