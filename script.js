// 此处配置你需要hook的java类方法
const customPrivacyClassMethods = {
  // // 要 hook 的 Java 类
  // "android.telephony.TelephonyManager": [
  //   ["$init", "读取手机状态和身份"], // hook 构造函数需要使用 $init
  //   ["someFunction", "读取手机状态和身份"], // 要 hook 的 Java 方法
  // ],
};

const basePrivacyClassMethods = {
  "android.telephony.TelephonyManager": [
    ["getDeviceId", "读取手机状态和身份"], // API level 26 获取IMEI的方法
    ["getImei", "读取手机状态和身份"], // API level 26 以上获取IMEI的方法
    ["getMeid", "读取手机状态和身份"],
    ["getSimSerialNumber", "读取手机状态和身份"], // imsi/iccid
    ["getSubscriberId", "读取手机状态和身份"], // imsi
    ["getNetworkType", "读取手机状态和身份"], // imsi
    ["getTelephonyProperty", "读取设备运营商"], // imsi
    ["call", "拨打电话"],
  ],
  "android.provider.Settings$Secure": [["getString", "获取Android ID"]],
  "android.os.Build": [
    ["getString", "读取设备序列号"],
    ["getSerial", "读取设备序列号"],
  ],
  "java.io.RandomAccessFile": [["$init", "读取文件"]],
  "android.content.pm.PackageManager": [
    ["getInstalledPackages", "获取app信息", "getInstalledPackages"],
    ["getInstalledApplications", "获取app信息", "getInstalledApplications"],
  ],
  "android.app.ApplicationPackageManager": [
    ["getInstalledPackages", "获取app信息"],
    ["getInstalledApplications", "获取app信息"],
    ["queryIntentActivities", "获取app信息"],
    ["getApplicationInfo", "获取app信息"],
    ["getApplicationInfoAsUser", "获取app信息"],
  ],
  "android.app.ActivityManager": [["getRunningAppProcesses", "获取app信息"]],
  "android.location.LocationManager": [
    ["getLastKnownLocation", "获取位置信息"],
    ["requestLocationUpdates", "获取位置信息"],
  ],
  "android.hardware.Camera": [["open", "调用摄像头"]],
  "android.net.wifi.WifiInfo": [
    ["getIpAddress", "获取网络信息"],
    ["getMacAddress", "获取网络信息"],
    ["getSSID", "获取网络信息"],
    ["getBSSID", "获取网络信息"],
  ],
  "android.net.wifi.WifiManager": [["getConnectionInfo", "获取网络信息"]],
  "android.net.NetworkInfo": [
    ["getType", "获取网络信息"],
    ["getTypeName", "获取网络信息"],
    ["getExtraInfo", "获取网络信息"],
    ["isAvailable", "获取网络信息"],
    ["isConnected", "获取网络信息"],
  ],
  "android.net.ConnectivityManager": [
    ["getActiveNetworkInfo", "访问网络状态信息"],
    ["getNetworkInfo", "访问网络状态信息"],
    ["getActiveNetwork", "访问网络状态信息"],
  ],
  "java.net.NetworkInterface": [["getHardwareAddress", "获取网络信息"]],
  "java.net.InetAddress": [["getHostAddress", "获取网络信息"]],
  "android.bluetooth.BluetoothDevice": [
    ["getName", "获取蓝牙信息"],
    ["getAddress", "获取蓝牙信息"],
  ],
  "android.bluetooth.BluetoothAdapter": [["getName", "获取蓝牙信息"]],
  "android.telephony.cdma.CdmaCellLocation": [
    ["getBaseStationId", "获取基站信息"], // 电信卡cid lac
    ["getNetworkId", "获取基站信息"], // 电信卡cid lac
  ],
  "android.telephony.gsm.GsmCellLocation": [
    ["getCid", "获取基站信息"], // 移动 联通卡 cid/lac
    ["getLac", "获取基站信息"], // 移动 联通卡 cid/lac
  ],
  "io.flutter.plugin.platform.PlatformPlugin": [["getClipboardData", "读取剪贴板"]],
  "android.telephony.SmsManager": [
    ["sendTextMessageInternal", "获取短信信息"],
    ["sendMultipartTextMessageInternal", "获取短信信息"],
    ["sendDataMessage", "获取短信信息"],
  ],
};

// 获取调用堆栈
function getStackTrace() {
  const Exception = Java.use("java.lang.Exception");
  const ins = Exception.$new("Exception");
  const straces = ins.getStackTrace();
  if (undefined == straces) {
    return;
  }
  let result = "";
  for (let i = 0; i < straces.length; i++) {
    const str = "   " + straces[i].toString();
    result += str + "\r\n";
  }
  Exception.$dispose();
  return result;
}

// 记录日志
function log(action, messages) {
  const nowStr = new Date().toISOString();
  if (messages == null) messages = action;
  send({
    type: "notice",
    time: nowStr,
    action: action,
    messages: messages,
    stacks: getStackTrace(),
  });
}

// 跟踪类方法
function traceClassMethods(clsName, methods) {
  let cls;
  try {
    cls = Java.use(clsName);
  } catch (e) {
    console.log(e);
    return;
  }
  for (const item of methods) {
    const method = item[0];
    const action = item[0];
    const message = item[1];
    if (cls && cls[method]) {
      const fun = cls[method];
      for (let i = 0; i < fun.overloads.length; i++) {
        try {
          fun.overloads[i].implementation = function () {
            log(action, message);
            return this[method].apply(this, arguments);
          };
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}

function getPravicyClassMethods(config) {
  for (const targetClass in config) {
    const targetMethods = config[targetClass];
    traceClassMethods(targetClass, targetMethods);
  }
}

// 获取content敏感信息
function getContentProvider() {
  let contact_authority, calendar_authority, browser_authority;
  try {
    // 通讯录内容
    const ContactsContract = Java.use("android.provider.ContactsContract");
    contact_authority = ContactsContract.class.getDeclaredField("AUTHORITY").get("java.lang.Object");
  } catch (e) {
    console.log(e);
  }
  try {
    // 日历内容
    const CalendarContract = Java.use("android.provider.CalendarContract");
    calendar_authority = CalendarContract.class.getDeclaredField("AUTHORITY").get("java.lang.Object");
  } catch (e) {
    console.log(e);
  }
  try {
    // 浏览器内容
    const BrowserContract = Java.use("android.provider.BrowserContract");
    browser_authority = BrowserContract.class.getDeclaredField("AUTHORITY").get("java.lang.Object");
  } catch (e) {
    console.log(e);
  }
  try {
    const ContentResolver = Java.use("android.content.ContentResolver");
    ContentResolver.query.overload("android.net.Uri", "[Ljava.lang.String;", "android.os.Bundle", "android.os.CancellationSignal").implementation = function (p1, p2, p3, p4) {
      const temp = this.query(p1, p2, p3, p4);
      if (p1.toString().indexOf(contact_authority) != -1) {
        log("获取content敏感信息", "获取手机通信录内容");
      } else if (p1.toString().indexOf(calendar_authority) != -1) {
        log("获取content敏感信息", "获取日历内容");
      } else if (p1.toString().indexOf(browser_authority) != -1) {
        log("获取content敏感信息", "获取浏览器内容");
      }
      return temp;
    };
  } catch (e) {
    console.log(e);
    return;
  }
}

function main() {
  try {
    Java.perform(function () {
      console.log("合规检测敏感接口开始监控...");
      send({ type: "isHook" });
      getContentProvider();
      getPravicyClassMethods(basePrivacyClassMethods);
      getPravicyClassMethods(customPrivacyClassMethods);
    });
  } catch (e) {
    console.log(e);
  }
}
