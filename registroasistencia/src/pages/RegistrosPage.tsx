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

type BackendAttendance = {
  record?: number;    // puede venir como número
  date?: string;      // "YYYY-MM-DD"
  time?: string;      // "HH:mm:ss"
  join_date?: string; // "YYYY-MM-DD HH:mm:ss" (opcional)
};

type UserData = {
  record: number;
  user: string;
  names?: string;
  lastnames?: string;
  id?: string;
};

const TZ = 'America/Guayaquil';

/** Convierte Date→partes en la zona de Ecuador */
const partsObj = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date);
  const obj: Record<string, string> = {};
  parts.forEach(p => (obj[p.type] = p.value));
  return obj; // {weekday,year,month,day,hour,minute,second}
};

const formatDateEC = (d: Date) => {
  const o = partsObj(d);
  return `${o.year}-${o.month}-${o.day}`;
};
const formatTimeEC = (d: Date) => {
  const o = partsObj(d);
  return `${o.hour}:${o.minute}:${o.second}`;
};

/** Atraso según hora/día en Ecuador */
const isLateEC = (d: Date) => {
  const o = partsObj(d);
  const wd = o.weekday;               // 'Sun','Mon','Tue','Wed','Thu','Fri','Sat'
  const h  = Number(o.hour || '0');
  return (wd === 'Wed' && h >= 17) || (wd === 'Sat' && h >= 8);
};

/** Intenta construir un Date con la info que venga del backend */
const makeDateFromBackend = (row: BackendAttendance): Date | null => {
  if (row.join_date) {
    const d = new Date(row.join_date.replace(' ', 'T'));
    if (!isNaN(+d)) return d;
  }
  if (row.date && row.time) {
    const d = new Date(`${row.date}T${row.time}`);
    if (!isNaN(+d)) return d;
    const d2 = new Date(`${row.date} ${row.time}`);
    if (!isNaN(+d2)) return d2;
  }
  if (row.date) {
    const d = new Date(`${row.date}T00:00:00`);
    if (!isNaN(+d)) return d;
  }
  return null;
};

const RegistrosPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rows, setRows] = useState<BackendAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Carga el usuario (tomamos el record para consultar)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      setUserData(u);
    } catch {
      setUserData(null);
    }
  }, []);

  const fetchRegistros = useCallback(async () => {
    if (!userData?.record && userData?.record !== 0) {
      setErrMsg('No hay usuario válido en sesión.');
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrMsg(null);
    try {
      // GET remoto vía proxy: /api/examen.php?record=<record>
      const url = `/api/examen.php?record=${encodeURIComponent(String(userData.record))}`;
      const resp = await fetch(url, { method: 'GET' });
      const ct = resp.headers.get('content-type') || '';

      let payload: any;
      if (ct.includes('application/json')) {
        payload = await resp.json();
      } else {
        // si viene texto, intenta parsear; si no, muestra error
        const text = await resp.text();
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(text || 'Respuesta no JSON del backend');
        }
      }

      // Normaliza a array (por si a veces devuelven objeto)
      const arr: BackendAttendance[] = Array.isArray(payload) ? payload : [payload];

      // Filtra filas no-vacías
      const norm = arr.filter(
        r => r && (r.date || r.time || r.join_date || typeof r.record !== 'undefined')
      );

      // Ordena desc por fecha/hora
      norm.sort((a, b) => {
        const da = makeDateFromBackend(a);
        const db = makeDateFromBackend(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.getTime() - da.getTime();
      });

      setRows(norm);
    } catch (e: any) {
      console.error('Error al obtener registros remotos:', e);
      setErrMsg(e?.message || 'Error al obtener registros');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userData?.record]);

  useEffect(() => {
    if (userData) fetchRegistros();
  }, [userData, fetchRegistros]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Registros</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={fetchRegistros}>Refrescar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="registros-page">
        <div className="card-right">
          {!userData ? (
            <div className="text-center" style={{ padding: '1rem' }}>
              <p>Inicia sesión para ver tus registros.</p>
            </div>
          ) : loading ? (
            <div className="text-center" style={{ padding: '2rem' }}>
              <IonSpinner name="dots" />
              <p className="mt-8">Cargando registros…</p>
            </div>
          ) : errMsg ? (
            <div className="text-center" style={{ padding: '1rem', color: 'crimson' }}>
              <p>{errMsg}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center" style={{ padding: '1rem' }}>
              <p>No hay registros para mostrar.</p>
            </div>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Record</th>
                  <th>Fecha (EC)</th>
                  <th>Hora (EC)</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const d = makeDateFromBackend(r);
                  const fecha = d ? formatDateEC(d) : (r.date ?? '-');
                  const hora  = d ? formatTimeEC(d) : (r.time ?? '-');
                  const late  = d ? isLateEC(d) : false;

                  const usuario =
                    userData?.user ||
                    [userData?.names, userData?.lastnames].filter(Boolean).join(' ') ||
                    '-';

                  const record = typeof r.record !== 'undefined'
                    ? String(r.record)
                    : String(userData?.record ?? '-');

                  return (
                    <tr key={i} className={late ? 'row-late' : ''}>
                      <td data-label="Usuario">{usuario}</td>
                      <td data-label="Record">{record}</td>
                      <td data-label="Fecha (EC)">{fecha}</td>
                      <td data-label="Hora (EC)">{hora}</td>
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
