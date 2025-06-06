import paramiko
import os
import time

# SSH 連線設定
ssh_config = {
    'hostname': '192.168.0.4',
    'username': 'root',
    'password': 'root',
    'port': 22
}

remote_file_path = 'yolocpp/output.csv'
local_file_path = './output/output.csv'  # 直接存到 output 目錄


def fetch_file():
    transport = None
    sftp = None
    try:
        transport = paramiko.Transport((ssh_config['hostname'], ssh_config['port']))
        # 強制指定協定為 ssh-rsa
        transport.connect(username=ssh_config['username'], password=ssh_config['password'], hostkey=None)
        # transport.get_security_options().key_types = ['ssh-rsa']
        sftp = paramiko.SFTPClient.from_transport(transport)
        # 確保 output 目錄存在
        os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
        sftp.get(remote_file_path, local_file_path)
        print('檔案下載完成')

        # 讀取檔案內容
        with open(local_file_path, 'r', encoding='utf-8') as f:
            data = f.read()
            print('檔案內容已讀取')
        return data
    except Exception as e:
        print('SFTP 下載或處理檔案失敗:', e)
        return None
    finally:
        if sftp is not None:
            sftp.close()
        if transport is not None:
            transport.close()


def main():
    while True:
        fetch_file()
        time.sleep(1)

if __name__ == '__main__':
    main()
