import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import RtspContainer from '../components/RtspContainer';
import './Home.css';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>RTSP 测试</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">RTSP 测试</IonTitle>
          </IonToolbar>
        </IonHeader>
        <RtspContainer />
      </IonContent>
    </IonPage>
  );
};

export default Home;
