import frida
import sys
import time
import argparse
import signal
import os
import xlwt
import random

def frida_hook(app_name, wait_time=0, is_show=True, execl_file=None):
    """

    :param wait_time: 延迟hook，避免加壳
    :param app_name: 包名
    :param is_show: 是否实时显示告警
    :param execl_file 导出文件

    :return:
    """

    # 消息处理
    def my_message_handler(message, payload):
        if message["type"] == "error":
            print(message)
            os.kill(os.getpid(), signal.SIGTERM)
            return
        if message['type'] == 'send':
            data = message["payload"]
            if data["type"] == "notice":
                alert_time = data['time']
                action = data['action']
                messages = data['messages']
                stacks = data['stacks']
                if is_show:
                    print(
                        "------------------------------start---------------------------------")
                    print(
                        "[*] {0}，APP行为：{1}，行为描述：{2}".format(alert_time, action, messages))
                    print("[*] 调用堆栈：")
                    print(stacks)
                    print(
                        "-------------------------------end----------------------------------")
                if execl_file:
                    global index_row
                    worksheet.write(index_row, 0, alert_time, content_style)
                    worksheet.write(index_row, 1, action, content_style)
                    worksheet.write(index_row, 2, messages, content_style)
                    worksheet.write(index_row, 3, stacks, content_style)
                    index_row += 1
            if data['type'] == "app_name":
                get_app_name = data['data']
                my_data = False if get_app_name == app_name else True
                script.post({"my_data": my_data})
            if data['type'] == "isHook":
                global isHook
                isHook = True

    try:
        device = frida.get_usb_device()
        pid = device.spawn([app_name])
    except Exception as e:
        print("[*] hook error")
        print(e)
        exit()

    time.sleep(1)
    session = device.attach(pid)
    time.sleep(1)

    if execl_file:
        workbook = xlwt.Workbook(encoding='utf-8')
        worksheet = workbook.add_sheet('app_privacy_trace')
        # 标题字体
        title_style = xlwt.XFStyle()
        title_font = xlwt.Font()
        title_font.bold = True  # 黑体
        title_font.height = 30 * 11
        title_style.font = title_font
        # 对其方式
        alignment = xlwt.Alignment()
        alignment.horz = xlwt.Alignment.HORZ_CENTER
        alignment.vert = xlwt.Alignment.VERT_CENTER
        title_style.alignment = alignment

        # 标题
        worksheet.write(0, 0, '时间', title_style)
        worksheet.col(0).width = 20 * 300
        worksheet.row(0).height_mismatch = True
        worksheet.row(0).height = 20 * 25
        worksheet.write(0, 1, '事件', title_style)
        worksheet.col(1).width = 20 * 300
        worksheet.write(0, 2, '描述', title_style)
        worksheet.col(2).width = 20 * 400
        worksheet.write(0, 3, '调用堆栈', title_style)
        worksheet.col(3).width = 20 * 1200

        content_style = xlwt.XFStyle()
        content_font = xlwt.Font()
        content_font.height = 20 * 11
        content_style.font = content_font
        content_style.alignment = alignment
        content_style.alignment.wrap = 1

    with open("./script.js", encoding="utf-8") as f:
        script_read = f.read()

    if wait_time:
        script_read += "setTimeout(main, {0}000);\n".format(str(wait_time))
    else:
        script_read += "setImmediate(main);\n"

    script = session.create_script(script_read)
    script.on("message", my_message_handler)
    script.load()
    time.sleep(1)
    try:
        device.resume(pid)
    except Exception as e:
        print("[*] hook error")
        print(e)
        exit()

    wait_time += 1
    time.sleep(wait_time)
    if isHook:
        def stop(signum, frame):
            print('[*] You have stoped hook.')
            session.detach()
            if execl_file:
                workbook.save(execl_file)
            exit()

        signal.signal(signal.SIGINT, stop)
        signal.signal(signal.SIGTERM, stop)
        sys.stdin.read()
    else:
        print("[*] hook fail, try delaying hook, adjusting delay time")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Android Privacy Trace Tool")
    parser.add_argument("package", help="Package name, ex: com.test.demo ")
    parser.add_argument("--time", "-t", default=0, type=int,
                        help="Delayed hook, the number is in seconds ex: 5")
    parser.add_argument("--noshow", "-ns", required=False, action="store_const", default=True, const=False,
                        help="Showing privacy trace message")
    parser.add_argument("--file", "-f", metavar="<path>", required=False,
                        default="result.xls", help="Path of Excel file to save")
    args = parser.parse_args()
    # 全局变量
    isHook = False
    index_row = 1
    frida_hook(args.package, args.time, args.noshow, args.file)
