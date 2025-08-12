import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const [fechaHora, setFechaHora] = useState('');
  const history = useHistory();

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const formateada = ahora.toISOString().slice(0, 19).replace('T', ' ');
      setFechaHora(formateada);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cerrarSesion = () => {
    // Aquí podrías limpiar token o datos de sesión
    history.push('/login'); // Redirige al login
  };

  return (
    <IonPage>
      {/* Header con botón Cerrar sesión */}
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
            <h3 className="name">LUIS FELIPE CEPEDA PERALTA</h3>
            <p className="fecha">Fecha y hora: {fechaHora}</p>
            <p>Para registrar su asistencia ingrese los dígitos de su cédula</p>

            <div className="inputs-cedula">
              <div className="cedula-field">
                <span className="input-index">1</span>
                <IonInput
                  placeholder="Digite el dígito"
                  className="cedula-input"
                  type="text"
                  inputmode="numeric"
                />
              </div>
              <div className="cedula-field">
                <span className="input-index">2</span>
                <IonInput
                  placeholder="Digite el dígito"
                  className="cedula-input"
                  type="text"
                  inputmode="numeric"
                />
              </div>
            </div>

            <IonButton className="btn-registrar" expand="block">
              Registrar
            </IonButton>

            <IonButton routerLink="/registros" expand="block" fill="outline">
              Ver registros
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
