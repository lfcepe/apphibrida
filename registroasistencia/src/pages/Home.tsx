import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

type UserData = {
  record: number;
  id: string;
  lastnames: string;
  names: string;
  user: string;
  mail?: string;
  phone?: string;
};

const Home: React.FC = () => {
  const [fechaHora, setFechaHora] = useState('');
  const [digit1, setDigit1] = useState('');
  const [digit2, setDigit2] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [reqIdx, setReqIdx] = useState<{ a: number; b: number } | null>(null);
  const [sending, setSending] = useState(false);
  const history = useHistory();

  // Reloj simple (hora local del navegador)
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setFechaHora(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carga usuario
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        parsed.id = String(parsed.id ?? '');
        setUserData(parsed);
      } catch {
        localStorage.removeItem('user');
        history.replace('/login');
      }
    } else {
      history.replace('/login');
    }
  }, [history]);

  // Posiciones aleatorias (1..len)
  const rollPositions = (len: number) => {
    if (len < 2) return { a: 1, b: 1 };
    const a = Math.floor(Math.random() * len) + 1;
    let b = Math.floor(Math.random() * len) + 1;
    while (b === a) b = Math.floor(Math.random() * len) + 1;
    return { a, b };
  };

  // Inicializa posiciones cuando haya cédula
  useEffect(() => {
    if (userData?.id) {
      setReqIdx(rollPositions(userData.id.length));
      setDigit1('');
      setDigit2('');
    }
  }, [userData?.id]);

  const indicacion = useMemo(() => {
    if (!reqIdx) return '';
    return `Para registrar su asistencia ingrese los dígitos #${reqIdx.a} y #${reqIdx.b} de su cédula`;
  }, [reqIdx]);

  const onlyOneDigit = (val?: string | null) =>
    String(val ?? '').replace(/\D/g, '').slice(0, 1);

  // 🔴 Cerrar sesión: limpiar todo y reemplazar historial
  const cerrarSesion = () => {
    try {
      // limpia datos de tu app
      localStorage.removeItem('user');
      // si prefieres borrar TODO:
      // localStorage.clear();
      sessionStorage.clear();

      // (Opcional) limpia Cache Storage de la app
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
      // (Opcional) desregistrar service workers (si usaste uno)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
    } finally {
      // evita volver con "atrás" al Home
      history.replace('/login');
    }
  };

  const cambiarDigitos = () => {
    if (!userData?.id) return;
    setReqIdx(rollPositions(userData.id.length));
    setDigit1('');
    setDigit2('');
  };

  const validarDigitos = () => {
    if (!userData?.id || !reqIdx) return false;
    const ced = String(userData.id);
    const d1 = ced.charAt(reqIdx.a - 1);
    const d2 = ced.charAt(reqIdx.b - 1);
    return digit1 === d1 && digit2 === d2;
  };

  // REGISTRA por POST /api/examen.php con JSON { record_user, join_user }
  const registrarAsistencia = async () => {
    if (!userData || !reqIdx) {
      alert('Sesión no válida. Inicie sesión nuevamente.');
      history.replace('/login');
      return;
    }
    if (!digit1 || !digit2) {
      alert('Debe ingresar ambos dígitos solicitados.');
      return;
    }
    if (!validarDigitos()) {
      alert('Los dígitos no coinciden con su cédula.');
      return;
    }

    try {
      setSending(true);

      const resp = await fetch('/api/examen.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_user: userData.record,
          join_user: userData.user
        })
      });

      const ct = resp.headers.get('content-type') || '';
      const ok = resp.ok;
      let msg = 'Asistencia registrada correctamente';

      if (ct.includes('application/json')) {
        try {
          const payload = await resp.json();
          if (payload?.message) msg = String(payload.message);
          if (payload?.error && !ok) msg = String(payload.error);
        } catch { /* deja msg por defecto */ }
      }

      if (ok) {
        alert(msg);
        cambiarDigitos();
      } else {
        alert('Error al registrar asistencia: ' + msg);
      }
    } catch (err: any) {
      console.error('Error POST /api/examen.php', err);
      alert(err?.message || 'Error al conectar con el servidor');
    } finally {
      setSending(false);
    }
  };

  const listo = Boolean(userData?.id) && Boolean(reqIdx);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="danger" onClick={cerrarSesion}>
              Cerrar sesión
            </IonButton>
          </IonButtons>
          <IonTitle>Inicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-page">
        <div className="container">
          <div className="card-left">
            <img src="/logo2.png" alt="logo" className="home-logo" />
            <h4>Bienvenido</h4>
            <h3 className="name">
              {userData?.names?.toUpperCase()} {userData?.lastnames?.toUpperCase()}
            </h3>
            <p className="fecha">Fecha y hora: {fechaHora}</p>

            {!listo ? (
              <div style={{ padding: '1rem' }} className="text-center">
                <IonSpinner name="dots" />
                <p className="mt-8">Cargando datos…</p>
              </div>
            ) : (
              <>
                <p>{indicacion}</p>

                <div className="inputs-cedula">
                  <div className="cedula-field">
                    <span className="input-index">{reqIdx!.a}</span>
                    <IonInput
                      placeholder="Digite el dígito"
                      className="cedula-input"
                      type="text"
                      inputMode="numeric"
                      value={digit1}
                      onIonInput={(e) => setDigit1(onlyOneDigit(e.detail.value))}
                    />
                  </div>
                  <div className="cedula-field">
                    <span className="input-index">{reqIdx!.b}</span>
                    <IonInput
                      placeholder="Digite el dígito"
                      className="cedula-input"
                      type="text"
                      inputMode="numeric"
                      value={digit2}
                      onIonInput={(e) => setDigit2(onlyOneDigit(e.detail.value))}
                    />
                  </div>
                </div>

                <IonButton
                  className="btn-registrar"
                  expand="block"
                  onClick={registrarAsistencia}
                  disabled={sending}
                >
                  {sending ? 'Enviando…' : 'Registrar'}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={cambiarDigitos}
                  disabled={sending}
                  className="mt-8"
                >
                  Cambiar dígitos
                </IonButton>

                <IonButton
                  routerLink="/registros"
                  expand="block"
                  fill="outline"
                  disabled={sending}
                  className="mt-8"
                >
                  Ver registros
                </IonButton>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
