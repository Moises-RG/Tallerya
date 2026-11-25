import { useState, useEffect } from 'react';

const ETAPAS = [
  'Vehículo recibido',
  'En diagnóstico',
  'Esperando aprobación',
  'Reparación aprobada',
  'En reparación',
  'Listo para entregar'
];

const DATOS_INICIALES = [
  {
    id: 'ORD-101',
    placa: 'B4X-892',
    vehiculo: 'Toyota Yaris 2021',
    cliente: 'Carlos Mendoza',
    telefono: '987654321',
    kilometraje: 45200,
    falla: 'Ruido metálico al frenar en ruedas delanteras',
    estado: 'Esperando aprobación',
    cotizacion: {
      diagnostico: 'Desgaste severo de pastillas delanteras y rectificado de discos.',
      repuestos: 240,
      manoObra: 110,
      total: 350,
      tiempoEstimado: '3 horas'
    }
  },
  {
    id: 'ORD-102',
    placa: 'F2K-410',
    vehiculo: 'Hyundai Tucson 2019',
    cliente: 'Lucía Fernández',
    telefono: '945112233',
    kilometraje: 68500,
    falla: 'Mantenimiento preventivo 70,000 km + cambio de aceite',
    estado: 'En reparación',
    cotizacion: {
      diagnostico: 'Cambio de aceite sintético 5W-30, filtros y revisión de niveles.',
      repuestos: 280,
      manoObra: 120,
      total: 400,
      tiempoEstimado: '2 horas'
    }
  },
  {
    id: 'ORD-103',
    placa: 'C9M-115',
    vehiculo: 'Kia Rio 2022',
    cliente: 'Jorge Quispe',
    telefono: '912889445',
    kilometraje: 31000,
    falla: 'Testigo Check Engine encendido y pérdida de potencia',
    estado: 'Vehículo recibido',
    cotizacion: null
  }
];

export default function App() {
  const [ordenes, setOrdenes] = useState(() => {
    const guardado = localStorage.getItem('tallerya_ordenes_v1');
    return guardado ? JSON.parse(guardado) : DATOS_INICIALES;
  });

  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [ordenCotizar, setOrdenCotizar] = useState(null);
  const [ordenCliente, setOrdenCliente] = useState(null);

  const [formOrden, setFormOrden] = useState({
    placa: '',
    vehiculo: '',
    cliente: '',
    telefono: '',
    kilometraje: '',
    falla: ''
  });

  const [formCotizacion, setFormCotizacion] = useState({
    diagnostico: '',
    repuestos: '',
    manoObra: '',
    tiempoEstimado: '4 horas'
  });

  useEffect(() => {
    localStorage.setItem('tallerya_ordenes_v1', JSON.stringify(ordenes));
  }, [ordenes]);

  const totalOrdenes = ordenes.length;
  const porAprobar = ordenes.filter(o => o.estado === 'Esperando aprobación').length;
  const listos = ordenes.filter(o => o.estado === 'Listo para entregar').length;
  const ingresosAprobados = ordenes
    .filter(o =>
      ['Reparación aprobada', 'En reparación', 'Listo para entregar'].includes(o.estado) &&
      o.cotizacion
    )
    .reduce((acc, o) => acc + o.cotizacion.total, 0);

  const handleCrearOrden = (e) => {
    e.preventDefault();
    const nueva = {
      id: `ORD-${Math.floor(104 + Math.random() * 895)}`,
      ...formOrden,
      placa: formOrden.placa.toUpperCase().trim(),
      kilometraje: Number(formOrden.kilometraje),
      estado: 'Vehículo recibido',
      cotizacion: null
    };
    setOrdenes([nueva, ...ordenes]);
    setFormOrden({ placa: '', vehiculo: '', cliente: '', telefono: '', kilometraje: '', falla: '' });
    setMostrarFormNuevo(false);
  };

  const abrirCotizacion = (orden) => {
    setOrdenCotizar(orden);
    setFormCotizacion({
      diagnostico: orden.cotizacion?.diagnostico || '',
      repuestos: orden.cotizacion?.repuestos || '',
      manoObra: orden.cotizacion?.manoObra || '',
      tiempoEstimado: orden.cotizacion?.tiempoEstimado || '4 horas'
    });
  };

  const handleGuardarCotizacion = (e) => {
    e.preventDefault();
    const repuestos = Number(formCotizacion.repuestos);
    const manoObra = Number(formCotizacion.manoObra);

    const actualizadas = ordenes.map(o =>
      o.id === ordenCotizar.id
        ? {
            ...o,
            estado: 'Esperando aprobación',
            cotizacion: {
              diagnostico: formCotizacion.diagnostico,
              repuestos,
              manoObra,
              total: repuestos + manoObra,
              tiempoEstimado: formCotizacion.tiempoEstimado
            }
          }
        : o
    );
    setOrdenes(actualizadas);
    setOrdenCotizar(null);
  };

  const handleRespuestaCliente = (id, aprobado) => {
    const actualizadas = ordenes.map(o =>
      o.id === id
        ? { ...o, estado: aprobado ? 'Reparación aprobada' : 'En diagnóstico' }
        : o
    );
    setOrdenes(actualizadas);
    setOrdenCliente(null);
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    setOrdenes(ordenes.map(o => (o.id === id ? { ...o, estado: nuevoEstado } : o)));
  };

  const resetearDatos = () => {
    localStorage.removeItem('tallerya_ordenes_v1');
    setOrdenes(DATOS_INICIALES);
  };

  const ordenesFiltradas =
    filtroEstado === 'TODOS'
      ? ordenes
      : ordenes.filter(o => o.estado === filtroEstado);

  return (
    <div>
      <nav className="navbar navbar-light bg-white border-bottom mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold mb-0">
            TallerYa <small className="text-muted fw-normal">| Gestión de Taller</small>
          </span>
          <div className="d-flex gap-2">
            <button onClick={resetearDatos} className="btn btn-outline-secondary btn-sm">
              Restaurar datos
            </button>
            <button onClick={() => setMostrarFormNuevo(true)} className="btn btn-primary btn-sm">
              + Recepcionar vehículo
            </button>
          </div>
        </div>
      </nav>

      <div className="container pb-5">
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Autos en taller</div>
              <div className="kpi-value">{totalOrdenes}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Esperando aprobación</div>
              <div className="kpi-value text-warning">{porAprobar}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Listos para entrega</div>
              <div className="kpi-value text-success">{listos}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Ingresos aprobados</div>
              <div className="kpi-value">S/ {ingresosAprobados.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
            <span className="fw-bold">Órdenes de trabajo</span>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted mb-0">Estado:</label>
              <select
                className="form-select form-select-sm w-auto"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                {ETAPAS.map(etapa => (
                  <option key={etapa} value={etapa}>{etapa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Placa / Vehículo</th>
                  <th>Cliente</th>
                  <th>Falla reportada</th>
                  <th>Cotización</th>
                  <th>Estado actual</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map(ord => (
                  <tr key={ord.id}>
                    <td className="fw-semibold">{ord.id}</td>
                    <td>
                      <span className="badge bg-secondary me-1">{ord.placa}</span>
                      <div>{ord.vehiculo}</div>
                      <small className="text-muted">{ord.kilometraje.toLocaleString()} km</small>
                    </td>
                    <td>
                      <div>{ord.cliente}</div>
                      <small className="text-muted">Tel: {ord.telefono}</small>
                    </td>
                    <td style={{ maxWidth: '230px' }}>{ord.falla}</td>
                    <td>
                      {ord.cotizacion ? (
                        <div>
                          <strong>S/ {ord.cotizacion.total.toFixed(2)}</strong>
                          <div className="small text-muted">{ord.cotizacion.tiempoEstimado}</div>
                        </div>
                      ) : (
                        <span className="text-muted small">Pendiente</span>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        style={{ minWidth: '185px' }}
                        value={ord.estado}
                        onChange={(e) => handleCambiarEstado(ord.id, e.target.value)}
                      >
                        {ETAPAS.map(etapa => (
                          <option key={etapa} value={etapa}>{etapa}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          onClick={() => abrirCotizacion(ord)}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Cotizar
                        </button>
                        {ord.cotizacion && (
                          <button
                            onClick={() => setOrdenCliente(ord)}
                            className="btn btn-outline-dark btn-sm"
                          >
                            Enlace
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {mostrarFormNuevo && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Registrar ingreso de vehículo</h6>
                <button type="button" className="btn-close" onClick={() => setMostrarFormNuevo(false)}></button>
              </div>
              <form onSubmit={handleCrearOrden}>
                <div className="modal-body">
                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <label className="form-label small">Placa</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        required
                        value={formOrden.placa}
                        onChange={e => setFormOrden({ ...formOrden, placa: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Marca y modelo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.vehiculo}
                        onChange={e => setFormOrden({ ...formOrden, vehiculo: e.target.value })}
                      />
                    </div>
                    <div className="col-3">
                      <label className="form-label small">Kilometraje</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.kilometraje}
                        onChange={e => setFormOrden({ ...formOrden, kilometraje: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-7">
                      <label className="form-label small">Cliente</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.cliente}
                        onChange={e => setFormOrden({ ...formOrden, cliente: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.telefono}
                        onChange={e => setFormOrden({ ...formOrden, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label small">Falla o motivo de visita</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      required
                      value={formOrden.falla}
                      onChange={e => setFormOrden({ ...formOrden, falla: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMostrarFormNuevo(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Guardar orden
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {ordenCotizar && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">
                  Cotización - {ordenCotizar.id} ({ordenCotizar.placa})
                </h6>
                <button type="button" className="btn-close" onClick={() => setOrdenCotizar(null)}></button>
              </div>
              <form onSubmit={handleGuardarCotizacion}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label small">Diagnóstico técnico</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      required
                      value={formCotizacion.diagnostico}
                      onChange={e => setFormCotizacion({ ...formCotizacion, diagnostico: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="form-label small">Repuestos (S/)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        required
                        value={formCotizacion.repuestos}
                        onChange={e => setFormCotizacion({ ...formCotizacion, repuestos: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Mano de obra (S/)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        required
                        value={formCotizacion.manoObra}
                        onChange={e => setFormCotizacion({ ...formCotizacion, manoObra: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Tiempo est.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formCotizacion.tiempoEstimado}
                        onChange={e => setFormCotizacion({ ...formCotizacion, tiempoEstimado: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="border rounded p-2 bg-light d-flex justify-content-between">
                    <span>Total presupuesto:</span>
                    <strong>
                      S/ {(Number(formCotizacion.repuestos || 0) + Number(formCotizacion.manoObra || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOrdenCotizar(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Enviar al cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {ordenCliente && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="vista-movil-box p-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <small className="text-muted">Vista móvil cliente • {ordenCliente.placa}</small>
                <button type="button" className="btn-close btn-sm" onClick={() => setOrdenCliente(null)}></button>
              </div>

              <h6 className="fw-bold mb-0">{ordenCliente.vehiculo}</h6>
              <p className="small text-muted mb-2">Cliente: {ordenCliente.cliente}</p>

              <div className="alert alert-secondary py-1 px-2 small mb-3">
                Estado: <strong>{ordenCliente.estado}</strong>
              </div>

              <div className="mb-3">
                <div className="small fw-bold mb-1">Diagnóstico:</div>
                <p className="small border rounded p-2 bg-light mb-2">
                  {ordenCliente.cotizacion.diagnostico}
                </p>
                <div className="d-flex justify-content-between small">
                  <span>Repuestos:</span>
                  <span>S/ {ordenCliente.cotizacion.repuestos.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span>Mano de obra:</span>
                  <span>S/ {ordenCliente.cotizacion.manoObra.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>S/ {ordenCliente.cotizacion.total.toFixed(2)}</span>
                </div>
                <small className="text-muted">Tiempo estimado: {ordenCliente.cotizacion.tiempoEstimado}</small>
              </div>

              <div className="d-grid gap-2">
                <button
                  onClick={() => handleRespuestaCliente(ordenCliente.id, true)}
                  className="btn btn-success btn-sm"
                >
                  Aprobar cotización
                </button>
                <button
                  onClick={() => handleRespuestaCliente(ordenCliente.id, false)}
                  className="btn btn-outline-danger btn-sm"
                >
                  Rechazar / Pedir revisión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}