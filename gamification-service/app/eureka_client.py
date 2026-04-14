import requests
import socket
import os
import time

EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://localhost:8761/eureka")
APP_NAME = os.getenv("EUREKA_SERVICE_NAME", "gamification-service")
PORT = int(os.getenv("PORT", 8000))
INSTANCE_HOST = os.getenv("EUREKA_INSTANCE_HOST", "localhost")


def register_with_eureka():
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)

    instance_id = f"{INSTANCE_HOST}:{APP_NAME}:{PORT}"

    data = {
        "instance": {
            "instanceId": instance_id,
            "hostName": INSTANCE_HOST,
            "app": APP_NAME.upper(),
            "ipAddr": ip,
            "status": "UP",
            "port": {"$": PORT, "@enabled": True},
            "vipAddress": APP_NAME,
            "dataCenterInfo": {
                "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                "name": "MyOwn",
            },
        }
    }

    url = f"{EUREKA_SERVER}/apps/{APP_NAME.upper()}"

    while True:
        try:
            res = requests.post(url, json=data)
            print(f"Registered in Eureka: {res.status_code}")
            print(f"  → instanceId: {instance_id}")
            print(f"  → hostName: {INSTANCE_HOST}")
            print(f"  → port: {PORT}")
            break
        except Exception as e:
            print("Retrying Eureka...", e)
            time.sleep(5)