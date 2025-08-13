import React, { useEffect, useState, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonButton,
} from '@ionic/react';
import './RegistrosPage.css';

type OfflineRegistro = {
  savedAt?: string; // ISO guardado por el server local
  source?: string;
  payload?: {
    record_user: number;
    join_user: string;
  };
  // Compatibilidad si en el futuro lees directo del remoto:
  names?: string;
  lastnames?: string;
  date?: string; // "YYYY-MM-DD"
  time?: string; // "HH:mm:ss"
  user?: string;
};

const RegistrosPage: React.FC = () => {
  const [registros, setRegistros] = useState<OfflineRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const formateaFecha = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const formateaHora = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mi}:${ss}`;
  };

  // Convierte una fila (offline o remota) a Date local del registro
  const resolveDateFromRow = (row: OfflineRegistro): Date | null => {
    if (row.savedAt) {
      const d = new Date(row.savedAt);
      return isNaN(+d) ? null : d;
    }
    if (row.date && row.time) {
      const isoLike = `${row.date}T${row.time}`;
      const d = new Date(isoLike);
      if (!isNaN(+d)) return d;
      const d2 = new Date(`${row.date} ${row.time}`);
      return isNaN(+d2) ? null : d2;
    }
    return null;
  };

  // Reglas de atraso:
  // - Miércoles (3) >= 17:00
  // - Sábado   (6) >= 08:00
  const isLate = (d: Date) =>
    (d.getDay() === 3 && d.getHours() >= 17) ||
    (d.getDay() === 6 && d.getHours() >= 8);

  const obtenerRegistros = useCallback(async () => {
    setLoading(true);
    setErrMsg(null);
    try {
      const resp = await fetch('/api/offline-attendance');
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await resp.text();
        console.error('Respuesta no JSON:', text);
        throw new Error('No se pudo leer los registros locales.');
      }
      const data = (await resp.json()) as OfflineRegistro[];

      // Ordena desc por fecha
      data.sort((a, b) => {
        const da = resolveDateFromRow(a);
        const db = resolveDateFromRow(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.getTime() - da.getTime();
      });

      setRegistros(data);
    } catch (error: any) {
      console.error('Error al obtener registros locales:', error);
      setErrMsg(error?.message || 'Error al obtener registros locales');
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiarRegistros = async () => {
    if (!confirm('¿Desea eliminar los registros guardados localmente?')) return;
    try {
      const resp = await fetch('/api/offline-attendance', { method: 'DELETE' });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || 'No se pudo limpiar');
      }
      await obtenerRegistros();
      alert('Registros locales eliminados');
    } catch (e: any) {
      alert(e?.message || 'Error al limpiar registros');
    }
  };

  useEffect(() => {
    obtenerRegistros();
  }, [obtenerRegistros]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Registros</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={obtenerRegistros}>Refrescar</IonButton>
            <IonButton color="danger" onClick={limpiarRegistros}>
              Limpiar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="registros-page">
        <div className="card-right">
          {loading ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <IonSpinner name="dots" />
              <p className="mt-8">Cargando registros…</p>
            </div>
          ) : errMsg ? (
            <div className="text-center" style={{ padding: '1rem', color: 'crimson' }}>
              <p>{errMsg}</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center" style={{ padding: '1rem' }}>
              <p>No hay registros guardados localmente.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Record</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((row, i) => {
                  const d = resolveDateFromRow(row);
                  const late = !!(d && isLate(d));
                  const rowClass = late ? 'row-late' : '';

                  const nombreCompuesto = [row?.names, row?.lastnames].filter(Boolean).join(' ').trim();
                  const usuario = (
                    row?.payload?.join_user ??
                    row?.user ??
                    nombreCompuesto
                  ) || '-';

                  const record = row?.payload?.record_user ?? '-';
                  const fecha  = d ? formateaFecha(d) : row.date || '-';
                  const hora   = d ? formateaHora(d) : row.time || '-';

                  return (
                    <tr key={i} className={rowClass}>
                      <td data-label="Usuario">{usuario}</td>
                      <td data-label="Record">{record}</td>
                      <td data-label="Fecha">{fecha}</td>
                      <td data-label="Hora">{hora}</td>
                      <td data-label="Estado">
                        <span className={`status-badge ${late ? 'late' : 'ok'}`}>
                          {late ? 'Atrasado' : 'Puntual'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegistrosPage;
