import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonPage
} from '@ionic/react';
import './Home.css';

const Home: React.FC = () => {
  const [fechaHora, setFechaHora] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const formateada = ahora.toISOString().slice(0, 19).replace('T', ' ');
      setFechaHora(formateada);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <IonPage>
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
            <IonButton className="btn-registrar" expand="block">Registrar</IonButton>
          </div>

          <div className="card-right">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Día</th>
                  <th>Fecha</th>
                  <th>Hora de Registro</th>
                  <th>Hora de Entrada</th>
                  <th>Novedad</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    usuario: 'CEPEDA PERALTA LUIS FELIPE',
                    dia: 'Miércoles',
                    fecha: '2025-04-30',
                    horaRegistro: '17:00:00',
                    horaEntrada: '18:22:50',
                    novedad: '01:22:50 Atraso',
                  },
                ].map((row, index) => (
                  <tr key={index} className="atraso">
                    <td>{row.usuario}</td>
                    <td>{row.dia}</td>
                    <td>{row.fecha}</td>
                    <td>{row.horaRegistro}</td>
                    <td>{row.horaEntrada}</td>
                    <td>{row.novedad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;

