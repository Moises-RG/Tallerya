import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerOrdenPorId, actualizarOrden } from '../services/supabaseApi';

export default function CotizacionPublica() {
  const { id } = useParams();
  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    obtenerOrdenPorId(id)
      .then((data) => {
        if (!data) setError('No se encontró la orden solicitada.');
        else setOrden(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [id]);

  const responderCotizacion = async (aprobado) => {
    setProcesando(true);
    setError('');
    try {
      const nuevoEstado = aprobado ? 'Reparación aprobada' : 'En diagnóstico';
      const actualizada = await actualizarOrden(orden.id, { estado: nuevoEstado });
      setOrden(actualizada);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="container py-5 text-center small text-muted">Cargando cotización...</div>;

  return (
    <div className="container py-4">
      <div className="vista-movil-box p-3">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <span className="fw-bold">TallerYa</span>
          <small className="text-muted">Orden {orden?.codigo}</small>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        {orden && (
          <>
            <h6 className="fw-bold mb-0">{orden.vehiculo} ({orden.placa})</h6>
            <p className="small text-muted mb-2">Cliente: {orden.cliente}</p>

            <div className="alert alert-secondary py-1 px-2 small mb-3">
              Estado actual: <strong>{orden.estado}</strong>
            </div>

            {orden.diagnostico ? (
              <div className="mb-3">
                <div className="small fw-bold mb-1">Diagnóstico del taller:</div>
                <p className="small border rounded p-2 bg-light mb-2">{orden.diagnostico}</p>
                <div className="d-flex justify-content-between small">
                  <span>Repuestos:</span>
                  <span>S/ {Number(orden.repuestos).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span>Mano de obra:</span>
                  <span>S/ {Number(orden.mano_obra).toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total presupuesto:</span>
                  <span>S/ {Number(orden.total).toFixed(2)}</span>
                </div>
                <small className="text-muted">Tiempo estimado: {orden.tiempo_estimado}</small>
              </div>
            ) : (
              <p className="small text-muted">Aún no se ha emitido una cotización para esta orden.</p>
            )}

            {orden.estado === 'Esperando aprobación' && (
              <div className="d-grid gap-2 mb-2">
                <button
                  disabled={procesando}
                  onClick={() => responderCotizacion(true)}
                  className="btn btn-success btn-sm"
                >
                  Aprobar presupuesto
                </button>
                <button
                  disabled={procesando}
                  onClick={() => responderCotizacion(false)}
                  className="btn btn-outline-danger btn-sm"
                >
                  Rechazar / Pedir revisión
                </button>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-3 pt-2 border-top">
          <Link to="/" className="small text-decoration-none text-muted">Ir al portal de TallerYa</Link>
        </div>
      </div>
    </div>
  );
}