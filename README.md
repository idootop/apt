# APT ( Android Privacy Trace )

Android 隐私合规高敏接口调用检测工具 (based on [zhengjim/camille](https://github.com/zhengjim/camille))

## 准备工作

### 首先确保你有

- adb
- python3 运行环境
- 已经 root 了的安卓设备（或安卓虚拟机，AS 自带的即可），且已开启调试模式

### 安装项目依赖

```shell
pip install -r requirements.txt
```

### 下载安装 frida-server 到你的安卓设备（[下载地址](https://github.com/frida/frida/releases)）

_PS：注意选择与你设备对应的指令集架构，如 [frida-server-15.1.14-android-x86.xz](https://github.com/frida/frida/releases/download/15.1.14/frida-server-15.1.14-android-x86.xz)_

```shell
# 复制 frida-server 到 /data/local/tmp/
adb push frida-server /data/local/tmp/
# 在安卓设备上运行 shell
adb shell
# 获取 root 权限
su
# 修改 frida-server 运行权限
chmod 755 /data/local/tmp/frida-server
# 启动 frida-server
/data/local/tmp/frida-server &
```

## 运行

```shell
python main.py com.example.app # 替换成你的应用包名
```

如果一切顺利，此时应用会自动启动，且终端正常输出隐私接口调用信息

当终端终止时，会自动导出检测结果到 [result.xls](./result.xls)

## 自定义配置

你也可以在 [script.js](./script.js) 文件开头，按如下示例添加你想要跟踪的方法

更多高级用法，请参考 [Frida教程](https://github.com/hookmaster/frida-all-in-one)

```typescript
// 此处配置你需要hook的java类方法
const customPrivacyClassMethods = {
  // 要 hook 的 Java 类
  "android.telephony.TelephonyManager": [
    ["$init", "读取手机状态和身份"], // hook 构造函数需要使用 $init
    ["someFunction", "读取手机状态和身份"], // 要 hook 的 Java 方法
  ],
};
```

## 其他

你也可以选择第三方安卓隐私合规检测服务，比如：

[百度-史宾格安全及隐私合规平台](https://cloud.baidu.com/product/springer.html)

[友盟-隐私合规检测](https://apm.umeng.com/apps/list)：进入后台，选择一款 Android 应用，点击顶部“合规”
