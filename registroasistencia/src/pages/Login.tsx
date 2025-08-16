import React, { useState } from 'react';
import {
  IonButton, IonContent, IonInput, IonItem, IonIcon, IonPage
} from '@ionic/react';
import { useIonViewWillEnter } from '@ionic/react';
import { personCircle, lockClosed } from 'ionicons/icons';
import { useHistory } from 'react-router';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  // limpia inputs al entrar al login
  useIonViewWillEnter(() => {
    setUsuario('');
    setClave('');
  });

  const handleLogin = async () => {
    if (!usuario || !clave) {
      alert('Debe ingresar usuario y contraseña');
      return;
    }
    try {
      const resp = await fetch(
        `/api/examen.php?user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(clave)}`
      );
      const raw = await resp.text();
      let data: any;
      try { data = JSON.parse(raw); } catch {
        console.error('Respuesta no JSON:', raw);
        throw new Error('Respuesta inesperada del servidor');
      }
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('user', JSON.stringify(data[0]));
        history.replace('/home'); // evita volver a login con atrás
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al intentar iniciar sesión');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">
        <div className="login-wrapper">
          <div className="login-box">
            <img src="/logo2.png" alt="logo" className="login-logo" />
            <h2 className="ion-text-center">Registro de Asistencia</h2>

            <IonItem className="login-input">
              <IonIcon icon={personCircle} slot="start" />
              <IonInput
                placeholder="Ingrese su usuario"
                value={usuario}
                onIonChange={(e) => setUsuario(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem className="login-input">
              <IonIcon icon={lockClosed} slot="start" />
              <IonInput
                type="password"
                placeholder="Ingrese su contraseña"
                value={clave}
                onIonChange={(e) => setClave(e.detail.value ?? '')}
              />
            </IonItem>

            <IonButton expand="block" className="login-button" onClick={handleLogin}>
              Ingresar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
