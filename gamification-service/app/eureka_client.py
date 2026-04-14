import requests
import socket
import os
import time

EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://localhost:8761/eureka")
APP_NAME = "gamification-service"
PORT = int(os.getenv("PORT", 8000))


def register_with_eureka():
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)

    instance_id = f"{hostname}:{APP_NAME}:{PORT}"

    data = {
        "instance": {
            "instanceId": instance_id,
            "hostName": APP_NAME,
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
            print("Registered in Eureka:", res.status_code)
            break
        except Exception as e:
            print("Retrying Eureka...", e)
            time.sleep(5)