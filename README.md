# 在 Ionic 项目中集成 kaimo_rtsp_plugin 插件指南

## 前提条件

- 安装了 Node.js 和 npm
- 已创建 Ionic 项目
- 安装了 Android 开发环境

## 安装步骤

### 1. 安装插件

由于版本兼容性问题，需要使用 `--force` 标志：

```bash
npm install kaimo_rtsp_plugin --force
```

### 2. 添加 Android 平台

```bash
# 安装 Android 平台
npm install @capacitor/android --force

# 构建前端代码
npm run build

# 添加 Android 平台
npx cap add android
```

### 3. 配置 MainActivity.java

**注意：** 由于插件使用了 `@CapacitorPlugin` 注解自动注册，不需要在 MainActivity 中手动注册插件。

MainActivity.java 应该保持简单：

```java
package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // 不需要手动注册插件，因为插件使用了 @CapacitorPlugin 注解自动注册
  }
}
```

### 4. 添加必要的权限

在 `android/app/src/main/AndroidManifest.xml` 文件中添加必要的权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### 5. 创建 React 组件使用该插件

创建一个 TypeScript 文件，例如 `RtspContainer.tsx`：

```typescript
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

// 注册插件 - 注意：插件名称必须为 'rtsp_view'
const RtspView = registerPlugin<RtspViewPlugin>('rtsp_view');

interface RtspContainerProps {}

const RtspContainer: React.FC<RtspContainerProps> = () => {
  const [rtspUrl, setRtspUrl] = useState<string>('rtsp://example.com/stream');
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
```

### 6. 在页面中使用 RTSP 组件

修改 `Home.tsx` 或其他页面文件，引入 RTSP 组件：

```typescript
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
```

### 7. 构建和同步项目

```bash
# 构建前端代码
npm run build

# 将前端代码同步到 Android 项目
npx cap sync android
```

### 8. 编译 Android 应用

```bash
cd android
./gradlew assembleDebug
```

### 9. 在 Android Studio 中打开项目并运行

```bash
npx cap open android
```

然后在 Android Studio 中构建并运行应用。

## 常见问题及解决方案

### 1. 插件注册名称不匹配

确保在 JavaScript 中注册插件时使用正确的名称 `rtsp_view`：

```typescript
const RtspView = registerPlugin<RtspViewPlugin>('rtsp_view');
```

### 2. 版本兼容性问题

如果安装插件时遇到版本兼容性问题，可以使用 `--force` 标志：

```bash
npm install kaimo_rtsp_plugin --force
npm install @capacitor/android --force
```

### 3. Android 权限问题

确保在 AndroidManifest.xml 中添加了所有必要的权限。对于保存截图功能，需要外部存储权限。

### 4. 构建错误

如果在构建 Android 项目时遇到错误，请检查：
- Java 包名是否正确
- 是否使用了正确的插件注册方式
- 插件版本是否与项目其他依赖兼容

## 插件 API 参考

### JavaScript API

- `startPull({ url: string })`: 开始拉取 RTSP 流
- `stopPull()`: 停止拉取 RTSP 流
- `show({ x, y, width, height, url })`: 显示 RTSP 视图
- `close()`: 关闭 RTSP 视图
- `saveJpg({ directUrl: string })`: 保存当前帧为 JPEG 图像

## 注意事项

1. 确保使用真实的 RTSP URL 进行测试。
2. Android 设备需要有适当的权限才能访问外部存储（用于保存截图）。
3. 网络条件可能会影响 RTSP 流的质量和稳定性。
4. 如果使用 Android 10 或更高版本，可能需要额外的配置来支持外部存储访问。 