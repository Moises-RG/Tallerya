import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  ETAPAS,
  obtenerOrdenes,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
  obtenerTalleres,
  crearTaller,
  geocodificarDireccion
} from '../services/supabaseApi';

export default function DashboardTaller() {
  const { sesion } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('ORDENES'); // 'ORDENES' | 'MANTENIMIENTO' | 'LOCALES'

  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [mensajeGlobal, setMensajeGlobal] = useState('');
  const [errorGlobal, setErrorGlobal] = useState('');

  // Modales CRUD
  const [modalOrden, setModalOrden] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ordenCotizar, setOrdenCotizar] = useState(null);
  const [ordenCliente, setOrdenCliente] = useState(null);

  const [formOrden, setFormOrden] = useState({
    id: null,
    codigo: '',
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

  const [cargandoGeo, setCargandoGeo] = useState(false);
  const [formLocal, setFormLocal] = useState({
    nombre: '',
    distrito: '',
    direccion: '',
    telefono: '',
    especialidad: ''
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaOrdenes, listaTalleres] = await Promise.all([
        obtenerOrdenes(sesion.token),
        obtenerTalleres()
      ]);
      setOrdenes(listaOrdenes);
      setTalleres(listaTalleres);
    } catch (err) {
      setErrorGlobal(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // KPIs
  const totalOrdenes = ordenes.length;
  const pendientesValidar = ordenes.filter(
    (o) => o.estado === 'Pendiente validación admin' || o.estado === 'Esperando aprobación'
  ).length;
  const listos = ordenes.filter((o) => o.estado === 'Listo para entregar').length;
  const ingresosAprobados = ordenes
    .filter((o) =>
      ['Reparación aprobada', 'En reparación', 'Listo para entregar'].includes(o.estado)
    )
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  // CRUD Órdenes
  const abrirCrear = () => {
    setModoEdicion(false);
    setErrorGlobal('');
    setFormOrden({ id: null, codigo: '', placa: '', vehiculo: '', cliente: '', telefono: '', kilometraje: '', falla: '' });
    setModalOrden(true);
  };

  const abrirEditar = (ord) => {
    setModoEdicion(true);
    setErrorGlobal('');
    setFormOrden({
      id: ord.id,
      codigo: ord.codigo,
      placa: ord.placa,
      vehiculo: ord.vehiculo,
      cliente: ord.cliente,
      telefono: ord.telefono,
      kilometraje: ord.kilometraje,
      falla: ord.falla
    });
    setModalOrden(true);
  };

  const handleGuardarOrden = async (e) => {
    e.preventDefault();
    setErrorGlobal('');
    const placaLimpia = formOrden.placa.toUpperCase().trim();
    if (!/^[A-Z0-9]{3}-[0-9]{3}$/.test(placaLimpia)) {
      setErrorGlobal('La placa debe tener el formato ABC-123.');
      return;
    }

    try {
      const payload = {
        placa: placaLimpia,
        vehiculo: formOrden.vehiculo.trim(),
        cliente: formOrden.cliente.trim(),
        telefono: formOrden.telefono.trim(),
        kilometraje: Number(formOrden.kilometraje),
        proximo_mantenimiento: Number(formOrden.kilometraje) + 5000,
        falla: formOrden.falla.trim()
      };

      if (modoEdicion) {
        const actualizada = await actualizarOrden(formOrden.id, payload, sesion.token);
        setOrdenes(ordenes.map((o) => (o.id === actualizada.id ? actualizada : o)));
        setMensajeGlobal(`Orden ${actualizada.codigo} actualizada en PostgreSQL.`);
      } else {
        const nueva = await crearOrden(
          {
            ...payload,
            codigo: `ORD-${Math.floor(104 + Math.random() * 895)}`,
            estado: 'Vehículo recibido'
          },
          sesion.token
        );
        setOrdenes([nueva, ...ordenes]);
        setMensajeGlobal(`Orden ${nueva.codigo} creada correctamente.`);
      }
      setModalOrden(false);
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  const handleEliminarOrden = async (ord) => {
    if (!window.confirm(`¿Eliminar definitivamente la orden ${ord.codigo}?`)) return;
    try {
      await eliminarOrden(ord.id, sesion.token);
      setOrdenes(ordenes.filter((o) => o.id !== ord.id));
      setMensajeGlobal(`Orden ${ord.codigo} eliminada.`);
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  // Cotización (Doble validación: Mecánico -> Admin -> Cliente)
  const abrirCotizacion = (orden) => {
    setOrdenCotizar(orden);
    setFormCotizacion({
      diagnostico: orden.diagnostico || '',
      repuestos: orden.repuestos || '',
      manoObra: orden.mano_obra || '',
      tiempoEstimado: orden.tiempo_estimado || '4 horas'
    });
  };

  const handleGuardarCotizacion = async (e) => {
    e.preventDefault();
    const repuestos = Number(formCotizacion.repuestos);
    const mano_obra = Number(formCotizacion.manoObra);
    const siguienteEstado =
      sesion.rol === 'MECANICO' ? 'Pendiente validación admin' : 'Esperando aprobación';

    try {
      const actualizada = await actualizarOrden(
        ordenCotizar.id,
        {
          estado: siguienteEstado,
          diagnostico: formCotizacion.diagnostico.trim(),
          repuestos,
          mano_obra,
          total: repuestos + mano_obra,
          tiempo_estimado: formCotizacion.tiempoEstimado.trim()
        },
        sesion.token
      );
      setOrdenes(ordenes.map((o) => (o.id === actualizada.id ? actualizada : o)));
      setOrdenCotizar(null);
      setMensajeGlobal(
        sesion.rol === 'MECANICO'
          ? 'Diagnóstico enviado al Administrador para validación.'
          : 'Cotización aprobada internamente y lista para el cliente.'
      );
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  const handleValidarAdmin = async (id) => {
    try {
      const actualizada = await actualizarOrden(id, { estado: 'Esperando aprobación' }, sesion.token);
      setOrdenes(ordenes.map((o) => (o.id === actualizada.id ? actualizada : o)));
      setMensajeGlobal('Presupuesto validado y enviado al cliente.');
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  const handleRespuestaCliente = async (id, aprobado) => {
    try {
      const actualizada = await actualizarOrden(
        id,
        { estado: aprobado ? 'Reparación aprobada' : 'En diagnóstico' },
        sesion.token
      );
      setOrdenes(ordenes.map((o) => (o.id === actualizada.id ? actualizada : o)));
      setOrdenCliente(null);
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      const actualizada = await actualizarOrden(id, { estado: nuevoEstado }, sesion.token);
      setOrdenes(ordenes.map((o) => (o.id === actualizada.id ? actualizada : o)));
    } catch (err) {
      setErrorGlobal(err.message);
    }
  };

  // Registrar nueva sede consumiendo API Nominatim + PostgreSQL
  const handleAgregarLocal = async (e) => {
    e.preventDefault();
    setErrorGlobal('');
    setCargandoGeo(true);
    try {
      const coords = await geocodificarDireccion(formLocal.direccion, formLocal.distrito);
      const creado = await crearTaller(
        { ...formLocal, lat: coords.lat, lng: coords.lng },
        sesion.token
      );
      setTalleres([...talleres, creado]);
      setFormLocal({ nombre: '', distrito: '', direccion: '', telefono: '', especialidad: '' });
      setMensajeGlobal(`Sede guardada en PostgreSQL (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).`);
    } catch (err) {
      setErrorGlobal(err.message);
    } finally {
      setCargandoGeo(false);
    }
  };

  const ordenesFiltradas = ordenes.filter((o) => {
    const coincideEstado = filtroEstado === 'TODOS' || o.estado === filtroEstado;
    const coincideTexto =
      o.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.cliente.toLowerCase().includes(busqueda.toLowerCase());
    return coincideEstado && coincideTexto;
  });

  return (
    <div>
      <Navbar />
      <div className="container pb-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold mb-0">Panel de Taller ({sesion?.rol})</h5>
            <small className="text-muted">Sesión JWT activa: {sesion?.email}</small>
          </div>
          <div className="d-flex gap-2">
            <button onClick={cargarDatos} className="btn btn-outline-secondary btn-sm">
              Actualizar BD
            </button>
            <button onClick={abrirCrear} className="btn btn-primary btn-sm">
              + Recepcionar vehículo
            </button>
          </div>
        </div>

        {errorGlobal && <div className="alert alert-danger py-2 small">{errorGlobal}</div>}
        {mensajeGlobal && <div className="alert alert-success py-2 small">{mensajeGlobal}</div>}

        {/* KPIs */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Órdenes / Solicitudes</div>
              <div className="kpi-value">{totalOrdenes}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-box">
              <div className="kpi-label">Por validar / aprobar</div>
              <div className="kpi-value text-warning">{pendientesValidar}</div>
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

        {/* Pestañas */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button
              className={`nav-link ${vistaActiva === 'ORDENES' ? 'active fw-bold' : ''}`}
              onClick={() => setVistaActiva('ORDENES')}
            >
              Órdenes de Trabajo ({ordenes.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${vistaActiva === 'MANTENIMIENTO' ? 'active fw-bold' : ''}`}
              onClick={() => setVistaActiva('MANTENIMIENTO')}
            >
              Recordatorios Mantenimiento
            </button>
          </li>
          {sesion?.rol === 'ADMIN' && (
            <li className="nav-item">
              <button
                className={`nav-link ${vistaActiva === 'LOCALES' ? 'active fw-bold' : ''}`}
                onClick={() => setVistaActiva('LOCALES')}
              >
                Sedes y Mapa ({talleres.length})
              </button>
            </li>
          )}
        </ul>

        {cargando ? (
          <p className="text-muted small">Conectando con PostgreSQL...</p>
        ) : (
          <>
            {/* TAB 1: ÓRDENES CRUD */}
            {vistaActiva === 'ORDENES' && (
              <div className="card">
                <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 py-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ maxWidth: '230px' }}
                    placeholder="Buscar placa o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  <div className="d-flex align-items-center gap-2">
                    <label className="small text-muted mb-0">Estado:</label>
                    <select
                      className="form-select form-select-sm w-auto"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                      <option value="TODOS">Todos</option>
                      {ETAPAS.map((etapa) => (
                        <option key={etapa} value={etapa}>{etapa}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Placa / Vehículo</th>
                        <th>Cliente</th>
                        <th>Falla reportada</th>
                        <th>Cotización</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenesFiltradas.map((ord) => (
                        <tr key={ord.id}>
                          <td className="fw-semibold">{ord.codigo}</td>
                          <td>
                            <span className="badge bg-secondary me-1">{ord.placa}</span>
                            <div>{ord.vehiculo}</div>
                            <small className="text-muted">{Number(ord.kilometraje).toLocaleString()} km</small>
                          </td>
                          <td>
                            <div>{ord.cliente}</div>
                            <small className="text-muted">Tel: {ord.telefono}</small>
                          </td>
                          <td style={{ maxWidth: '200px' }}>{ord.falla}</td>
                          <td>
                            {ord.diagnostico ? (
                              <div>
                                <strong>S/ {Number(ord.total).toFixed(2)}</strong>
                                <div className="small text-muted">{ord.tiempo_estimado}</div>
                              </div>
                            ) : (
                              <span className="text-muted small">Sin cotizar</span>
                            )}
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              style={{ minWidth: '195px' }}
                              value={ord.estado}
                              onChange={(e) => handleCambiarEstado(ord.id, e.target.value)}
                            >
                              {ETAPAS.map((etapa) => (
                                <option key={etapa} value={etapa}>{etapa}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <button onClick={() => abrirCotizacion(ord)} className="btn btn-outline-primary btn-sm">
                                Cotizar
                              </button>

                              {sesion?.rol === 'ADMIN' && ord.estado === 'Pendiente validación admin' && (
                                <button onClick={() => handleValidarAdmin(ord.id)} className="btn btn-warning btn-sm">
                                  Validar
                                </button>
                              )}

                              {ord.diagnostico && ord.estado !== 'Pendiente validación admin' && (
                                <button onClick={() => setOrdenCliente(ord)} className="btn btn-outline-dark btn-sm">
                                  Link cliente
                                </button>
                              )}

                              <button onClick={() => abrirEditar(ord)} className="btn btn-outline-secondary btn-sm">
                                Editar
                              </button>

                              {sesion?.rol === 'ADMIN' && (
                                <button onClick={() => handleEliminarOrden(ord)} className="btn btn-outline-danger btn-sm">
                                  Eliminar
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
            )}

            {/* TAB 2: MANTENIMIENTO PREVENTIVO */}
            {vistaActiva === 'MANTENIMIENTO' && (
              <div className="card">
                <div className="card-header bg-white fw-bold">
                  Seguimiento de Mantenimiento Preventivo (Cada 5,000 km)
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Cliente</th>
                        <th>Km Ingreso</th>
                        <th>Próximo Servicio</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenes.map((ord) => {
                        const restante = ord.proximo_mantenimiento - ord.kilometraje;
                        return (
                          <tr key={ord.id}>
                            <td><strong>{ord.placa}</strong> - {ord.vehiculo}</td>
                            <td>{ord.cliente} ({ord.telefono})</td>
                            <td>{Number(ord.kilometraje).toLocaleString()} km</td>
                            <td>{Number(ord.proximo_mantenimiento).toLocaleString()} km</td>
                            <td>
                              {restante <= 1000 ? (
                                <span className="badge bg-warning text-dark">Próximo a vencer</span>
                              ) : (
                                <span className="badge bg-success">En rango ({restante} km)</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  setMensajeGlobal(`Recordatorio registrado para ${ord.cliente} (${ord.telefono}).`)
                                }
                                className="btn btn-outline-primary btn-sm"
                              >
                                Enviar aviso
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SEDES Y MAPA (ADMIN) */}
            {vistaActiva === 'LOCALES' && sesion?.rol === 'ADMIN' && (
              <div className="row g-3">
                <div className="col-12 col-md-5">
                  <div className="card">
                    <div className="card-header bg-white fw-bold">Nueva Sede (API OpenStreetMap)</div>
                    <div className="card-body">
                      <form onSubmit={handleAgregarLocal}>
                        <div className="mb-2">
                          <label className="form-label small">Nombre del taller</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            required
                            value={formLocal.nombre}
                            onChange={(e) => setFormLocal({ ...formLocal, nombre: e.target.value })}
                          />
                        </div>
                        <div className="row g-2 mb-2">
                          <div className="col-6">
                            <label className="form-label small">Distrito</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Miraflores"
                              required
                              value={formLocal.distrito}
                              onChange={(e) => setFormLocal({ ...formLocal, distrito: e.target.value })}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small">Teléfono</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="01-4451122"
                              required
                              value={formLocal.telefono}
                              onChange={(e) => setFormLocal({ ...formLocal, telefono: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="mb-2">
                          <label className="form-label small">Dirección exacta</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Av. Arequipa 4500"
                            required
                            value={formLocal.direccion}
                            onChange={(e) => setFormLocal({ ...formLocal, direccion: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small">Especialidad</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            required
                            value={formLocal.especialidad}
                            onChange={(e) => setFormLocal({ ...formLocal, especialidad: e.target.value })}
                          />
                        </div>
                        <button type="submit" disabled={cargandoGeo} className="btn btn-primary btn-sm w-100">
                          {cargandoGeo ? 'Geocodificando dirección...' : 'Guardar en PostgreSQL'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-7">
                  <div className="card">
                    <div className="card-header bg-white fw-bold">Talleres en Base de Datos</div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Taller</th>
                            <th>Dirección</th>
                            <th>Coordenadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {talleres.map((t) => (
                            <tr key={t.id}>
                              <td className="fw-semibold">{t.nombre}</td>
                              <td>{t.direccion} ({t.distrito})</td>
                              <td className="small text-muted">{t.lat.toFixed(4)}, {t.lng.toFixed(4)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalOrden && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">
                  {modoEdicion ? `Editar orden ${formOrden.codigo}` : 'Recepcionar vehículo'}
                </h6>
                <button type="button" className="btn-close" onClick={() => setModalOrden(false)}></button>
              </div>
              <form onSubmit={handleGuardarOrden}>
                <div className="modal-body">
                  <div className="row g-2 mb-2">
                    <div className="col-4">
                      <label className="form-label small">Placa</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        required
                        value={formOrden.placa}
                        onChange={(e) => setFormOrden({ ...formOrden, placa: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Marca / Modelo</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.vehiculo}
                        onChange={(e) => setFormOrden({ ...formOrden, vehiculo: e.target.value })}
                      />
                    </div>
                    <div className="col-3">
                      <label className="form-label small">Kilometraje</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.kilometraje}
                        onChange={(e) => setFormOrden({ ...formOrden, kilometraje: e.target.value })}
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
                        onChange={(e) => setFormOrden({ ...formOrden, cliente: e.target.value })}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Teléfono</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        required
                        value={formOrden.telefono}
                        onChange={(e) => setFormOrden({ ...formOrden, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label small">Falla reportada</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      required
                      value={formOrden.falla}
                      onChange={(e) => setFormOrden({ ...formOrden, falla: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOrden(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cotización */}
      {ordenCotizar && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Cotización - {ordenCotizar.codigo} ({ordenCotizar.placa})</h6>
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
                      onChange={(e) => setFormCotizacion({ ...formCotizacion, diagnostico: e.target.value })}
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
                        onChange={(e) => setFormCotizacion({ ...formCotizacion, repuestos: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Mano obra (S/)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        required
                        value={formCotizacion.manoObra}
                        onChange={(e) => setFormCotizacion({ ...formCotizacion, manoObra: e.target.value })}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small">Tiempo est.</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formCotizacion.tiempoEstimado}
                        onChange={(e) => setFormCotizacion({ ...formCotizacion, tiempoEstimado: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="border rounded p-2 bg-light d-flex justify-content-between">
                    <span>Total:</span>
                    <strong>S/ {(Number(formCotizacion.repuestos || 0) + Number(formCotizacion.manoObra || 0)).toFixed(2)}</strong>
                  </div>
                </div>
                <div className="modal-footer py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOrdenCotizar(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    {sesion?.rol === 'MECANICO' ? 'Enviar a validación Admin' : 'Guardar y enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Enlace Único del Cliente */}
      {ordenCliente && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="vista-movil-box p-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                <small className="text-muted">Vista móvil cliente • {ordenCliente.placa}</small>
                <button type="button" className="btn-close btn-sm" onClick={() => setOrdenCliente(null)}></button>
              </div>
              <div className="alert alert-light border py-1 px-2 small mb-2">
                Enlace único: <a href={`/cotizacion/${ordenCliente.id}`} target="_blank" rel="noreferrer">{window.location.origin}/cotizacion/{ordenCliente.id}</a>
              </div>
              <h6 className="fw-bold mb-0">{ordenCliente.vehiculo}</h6>
              <p className="small text-muted mb-2">Cliente: {ordenCliente.cliente}</p>
              <p className="small border rounded p-2 bg-light mb-2">{ordenCliente.diagnostico}</p>
              <div className="d-flex justify-content-between fw-bold mb-3">
                <span>Total:</span>
                <span>S/ {Number(ordenCliente.total).toFixed(2)}</span>
              </div>
              <div className="d-grid gap-2">
                <button onClick={() => handleRespuestaCliente(ordenCliente.id, true)} className="btn btn-success btn-sm">
                  Aprobar cotización
                </button>
                <button onClick={() => handleRespuestaCliente(ordenCliente.id, false)} className="btn btn-outline-danger btn-sm">
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