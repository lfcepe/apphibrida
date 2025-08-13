import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonIcon
} from '@ionic/react';
import { personCircle, lockClosed } from 'ionicons/icons';
import { useHistory } from 'react-router';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  const handleLogin = async () => {
    if (!usuario || !clave) {
      alert('Debe ingresar usuario y contraseña');
      return;
    }

    try {
      const response = await fetch(`/api/examen.php?user=${usuario}&pass=${clave}`); 

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Respuesta no JSON:", text);
        throw new Error("Respuesta inesperada del servidor");
      }

      const data = await response.json();

      if (data.length > 0) {
        const user = data[0];
        localStorage.setItem('user', JSON.stringify(user));
        history.push('/home');
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
                onIonChange={(e) => setUsuario(e.detail.value!)}
              />
            </IonItem>

            <IonItem className="login-input">
              <IonIcon icon={lockClosed} slot="start" />
              <IonInput
                type="password"
                placeholder="Ingrese su contraseña"
                value={clave}
                onIonChange={(e) => setClave(e.detail.value!)}
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