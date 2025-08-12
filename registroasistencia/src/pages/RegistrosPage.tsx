import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton } from '@ionic/react';
import './Home.css';

const RegistrosPage: React.FC = () => {
  const rows = [
    {
      usuario: 'CEPEDA PERALTA LUIS FELIPE',
      dia: 'Miércoles',
      fecha: '2025-04-30',
      horaRegistro: '17:00:00',
      horaEntrada: '18:22:50',
      novedad: '01:22:50 Atraso',
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Registros de Asistencia</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-page">
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
              {rows.map((row, i) => (
                <tr key={i} className="atraso">
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
      </IonContent>
    </IonPage>
  );
};

export default RegistrosPage;
