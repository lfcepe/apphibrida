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

  const handleLogin = () => {
    history.push('/home');
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
