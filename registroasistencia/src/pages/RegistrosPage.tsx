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

type BackendAttendance = {
  record?: number;
  date?: string;      // "YYYY-MM-DD"
  time?: string;      // "HH:mm:ss"
  join_date?: string; // "YYYY-MM-DD HH:mm:ss"
};

type UserData = {
  record: number;
  user: string;
  names?: string;
  lastnames?: string;
  id?: string;
};

// formateo simple (sin ajustes de zona)
const toDate = (row: BackendAttendance): Date | null => {
  if (row.join_date) {
    const d = new Date(row.join_date.replace(' ', 'T'));
    return isNaN(+d) ? null : d;
  }
  if (row.date && row.time) {
    const d = new Date(`${row.date}T${row.time}`);
    return isNaN(+d) ? null : d;
  }
  if (row.date) {
    const d = new Date(`${row.date}T00:00:00`);
    return isNaN(+d) ? null : d;
  }
  return null;
};

const pad = (n: number) => String(n).padStart(2, '0');
const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatTime = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const RegistrosPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [rows, setRows] = useState<BackendAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      setUserData(JSON.parse(raw));
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
      // ← ruta relativa: usa tu proxy / reverse proxy de /api
      const resp = await fetch(
        `/api/examen.php?record=${encodeURIComponent(String(userData.record))}&_ts=${Date.now()}`
      );

      const text = await resp.text();
      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(text || 'Respuesta no JSON del backend');
      }

      const arr: BackendAttendance[] = Array.isArray(payload) ? payload : [payload];

      const norm = arr
        .filter(r => r && (r.date || r.time || r.join_date || typeof r.record !== 'undefined'))
        .sort((a, b) => {
          const da = toDate(a);
          const db = toDate(b);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return db.getTime() - da.getTime(); // desc
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
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const d = toDate(r);
                  const fecha = d ? formatDate(d) : (r.date ?? '-');
                  const hora  = d ? formatTime(d) : (r.time ?? '-');

                  const usuario =
                    userData?.user ||
                    [userData?.names, userData?.lastnames].filter(Boolean).join(' ') ||
                    '-';

                  const record = typeof r.record !== 'undefined'
                    ? String(r.record)
                    : String(userData?.record ?? '-');

                  // estado “simple”
                  const late = false;

                  return (
                    <tr key={i} className={late ? 'row-late' : ''}>
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
