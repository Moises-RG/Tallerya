import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MapaTalleres from '../components/MapaTalleres';
import { obtenerTalleres, crearOrden } from '../services/supabaseApi';

export default function LandingPage() {
  const [talleres, setTalleres] = useState([]);
  const [tallerActivo, setTallerActivo] = useState(null);
  const [cargando, setCargando] = useState(true);

  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoForm, setExitoForm] = useState('');

  const [formCita, setFormCita] = useState({
    cliente: '',
    telefono: '',
    placa: '',
    vehiculo: '',
    kilometraje: '',
    falla: ''
  });

  useEffect(() => {
    obtenerTalleres()
      .then((data) => {
        setTalleres(data);
        if (data.length > 0) setTallerActivo(data[0]);
      })
      .catch((err) => setErrorForm(err.message))
      .finally(() => setCargando(false));
  }, []);

  const handleSolicitarCita = async (e) => {
    e.preventDefault();
    setErrorForm('');
    setExitoForm('');

    const placaLimpia = formCita.placa.toUpperCase().trim();
    if (!/^[A-Z0-9]{3}-[0-9]{3}$/.test(placaLimpia)) {
      setErrorForm('Ingresa una placa válida (Ej: ABC-123).');
      return;
    }
    if (!/^[0-9]{9}$/.test(formCita.telefono.trim())) {
      setErrorForm('El teléfono debe tener 9 dígitos.');
      return;
    }
    if (Number(formCita.kilometraje) <= 0) {
      setErrorForm('El kilometraje debe ser mayor a 0.');
      return;
    }

    setEnviando(true);
    try {
      const nuevaSolicitud = {
        codigo: `SOL-${Math.floor(100 + Math.random() * 899)}`,
        placa: placaLimpia,
        vehiculo: formCita.vehiculo.trim(),
        cliente: formCita.cliente.trim(),
        telefono: formCita.telefono.trim(),
        kilometraje: Number(formCita.kilometraje),
        proximo_mantenimiento: Number(formCita.kilometraje) + 5000,
        falla: formCita.falla.trim(),
        estado: 'Solicitud de cita'
      };

      const creada = await crearOrden(nuevaSolicitud);
      setExitoForm(
        `Solicitud enviada (${creada.codigo}). El taller se comunicará a tu celular para confirmar el horario de recepción.`
      );
      setFormCita({ cliente: '', telefono: '', placa: '', vehiculo: '', kilometraje: '', falla: '' });
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container pb-5">
        <div className="row g-4">
          {/* Columna Izquierda: Ubicación en Mapa y Contacto */}
          <div className="col-12 col-lg-7">
            <div className="card">
              <div className="card-header bg-white fw-bold">
                Ubicación y Contacto de Nuestros Talleres
              </div>
              <div className="card-body">
                {cargando ? (
                  <p className="text-muted small">Cargando mapa de sedes...</p>
                ) : (
                  <>
                    <MapaTalleres talleres={talleres} tallerSeleccionado={tallerActivo} />
                    <div className="row g-2 mt-3">
                      {talleres.map((t) => (
                        <div className="col-12 col-md-6" key={t.id}>
                          <div
                            onClick={() => setTallerActivo(t)}
                            className={`p-2 border rounded h-100 ${tallerActivo?.id === t.id ? 'border-primary bg-light' : ''}`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="fw-bold">{t.nombre}</div>
                            <div className="small text-muted">{t.direccion} - {t.distrito}</div>
                            <div className="small mt-1">Tel: <strong>{t.telefono}</strong></div>
                            <span className="badge bg-secondary mt-1">{t.especialidad}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Solicitud de Cita (Sin selección de fecha) */}
          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-header bg-white fw-bold">
                Solicitar Cita de Atención
              </div>
              <div className="card-body">
                <p className="small text-muted mb-3">
                  Déjanos los datos de tu vehículo y el problema reportado. Nuestro equipo revisará disponibilidad y te contactará para coordinar el ingreso.
                </p>

                {errorForm && <div className="alert alert-danger py-2 small">{errorForm}</div>}
                {exitoForm && <div className="alert alert-success py-2 small">{exitoForm}</div>}

                <form onSubmit={handleSolicitarCita}>
                  <div className="row g-2 mb-2">
                    <div className="col-7">
                      <label className="form-label small">Nombre completo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formCita.cliente}
                        onChange={(e) => setFormCita({ ...formCita, cliente: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Celular (9 dígitos)</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="987654321"
                        required
                        value={formCita.telefono}
                        onChange={(e) => setFormCita({ ...formCita, telefono: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <label className="form-label small">Placa</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        placeholder="ABC-123"
                        required
                        value={formCita.placa}
                        onChange={(e) => setFormCita({ ...formCita, placa: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Marca y modelo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Toyota Yaris"
                        required
                        value={formCita.vehiculo}
                        onChange={(e) => setFormCita({ ...formCita, vehiculo: e.target.value })}
                      />
                    </div>
                    <div className="col-3">
                      <label className="form-label small">Km aprox.</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="45000"
                        required
                        value={formCita.kilometraje}
                        onChange={(e) => setFormCita({ ...formCita, kilometraje: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Motivo de consulta o falla</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Describe brevemente qué ocurre con tu vehículo..."
                      required
                      value={formCita.falla}
                      onChange={(e) => setFormCita({ ...formCita, falla: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" disabled={enviando} className="btn btn-primary btn-sm w-100">
                    {enviando ? 'Enviando solicitud...' : 'Enviar solicitud de cita'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}