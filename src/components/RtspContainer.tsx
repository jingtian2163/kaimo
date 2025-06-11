import { IonButton, IonCol, IonGrid, IonInput, IonItem, IonLabel, IonRow } from '@ionic/react';
import { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

// 定义插件接口
interface RtspViewPlugin {
  startPull(options: { url: string }): Promise<void>;
  stopPull(): Promise<void>;
  show(options: { x: number; y: number; width: number; height: number; url: string }): Promise<void>;
  close(): Promise<void>;
  saveJpg(options: { directUrl: string }): Promise<{ success: boolean }>;
}

// 注册插件
const RtspView = registerPlugin<RtspViewPlugin>('rtsp_view');

interface RtspContainerProps {}

const RtspContainer: React.FC<RtspContainerProps> = () => {
  const [rtspUrl, setRtspUrl] = useState<string>('rtsp://192.168.108.71/live');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // 监听错误事件
  useEffect(() => {
    const handleError = (event: any) => {
      console.error(`RTSP错误: ${event.detail?.message || '未知错误'}`);
      alert(`RTSP错误: ${event.detail?.message || '未知错误'}`);
      setIsStreaming(false);
    };

    // 在原生插件中注册事件监听
    document.addEventListener('rtspError', handleError);

    // 组件卸载时移除监听器
    return () => {
      document.removeEventListener('rtspError', handleError);
    };
  }, []);

  const startStream = async () => {
    try {
      await RtspView.startPull({ url: rtspUrl });
      await RtspView.show({
        x: 0,
        y: 200,
        width: window.innerWidth,
        height: 300,
        url: rtspUrl
      });
      setIsStreaming(true);
    } catch (error) {
      console.error('启动RTSP流失败', error);
      alert('启动RTSP流失败: ' + (error as any)?.message || '未知错误');
    }
  };

  const stopStream = async () => {
    try {
      await RtspView.close();
      await RtspView.stopPull();
      setIsStreaming(false);
    } catch (error) {
      console.error('停止RTSP流失败', error);
      alert('停止RTSP流失败: ' + (error as any)?.message || '未知错误');
    }
  };

  const takeSnapshot = async () => {
    try {
      // 使用当前时间戳作为文件名
      const timestamp = new Date().getTime();
      const result = await RtspView.saveJpg({ 
        directUrl: `/storage/emulated/0/Download/rtsp_snapshot_${timestamp}.jpg` 
      });
      if (result.success) {
        alert('截图已保存到下载文件夹');
      } else {
        alert('截图保存失败');
      }
    } catch (error) {
      console.error('截图失败', error);
      alert('截图失败: ' + (error as any)?.message || '未知错误');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>RTSP 视频流</h2>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonItem>
              <IonLabel position="floating">RTSP URL</IonLabel>
              <IonInput 
                value={rtspUrl} 
                onIonChange={e => setRtspUrl(e.detail.value as string)} 
                placeholder="输入RTSP URL"
              />
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            {!isStreaming ? (
              <IonButton expand="block" onClick={startStream}>开始播放</IonButton>
            ) : (
              <IonButton expand="block" color="danger" onClick={stopStream}>停止播放</IonButton>
            )}
          </IonCol>
        </IonRow>
        {isStreaming && (
          <IonRow>
            <IonCol>
              <IonButton expand="block" color="secondary" onClick={takeSnapshot}>截图</IonButton>
            </IonCol>
          </IonRow>
        )}
      </IonGrid>
      <div style={{ height: '300px', marginTop: '20px', position: 'relative' }}>
        {/* RTSP 视图将由原生视图覆盖在此区域上 */}
        <div style={{ textAlign: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {isStreaming ? '视频加载中...' : '点击上方按钮开始播放'}
        </div>
      </div>
    </div>
  );
};

export default RtspContainer; 