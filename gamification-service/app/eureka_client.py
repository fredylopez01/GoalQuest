import requests
import socket
import os
import time
import threading

EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://localhost:8761/eureka")
APP_NAME = os.getenv("EUREKA_SERVICE_NAME", "gamification-service")
PORT = int(os.getenv("PORT", 8000))
INSTANCE_HOST = os.getenv("EUREKA_INSTANCE_HOST", "localhost")

INSTANCE_ID = f"{INSTANCE_HOST}:{APP_NAME}:{PORT}"

# Flag para evitar iniciar múltiples hilos de heartbeat
_heartbeat_started = False


def register_with_eureka():
    global _heartbeat_started
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)

    data = {
        "instance": {
            "instanceId": INSTANCE_ID,
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
            "leaseInfo": {
                "renewalIntervalInSecs": 30,
                "durationInSecs": 90,
            },
        }
    }

    url = f"{EUREKA_SERVER}/apps/{APP_NAME.upper()}"

    while True:
        try:
            res = requests.post(url, json=data)
            print(f"Registered in Eureka: {res.status_code}")
            print(f"  → instanceId: {INSTANCE_ID}")
            print(f"  → hostName: {INSTANCE_HOST}")
            print(f"  → port: {PORT}")

            if not _heartbeat_started:
                _heartbeat_started = True
                heartbeat_thread = threading.Thread(target=_send_heartbeat, daemon=True)
                heartbeat_thread.start()
                print("Eureka heartbeat thread started (every 30s)")

            break
        except Exception as e:
            print(f"Retrying Eureka... {e}")
            time.sleep(5)


def _send_heartbeat():
    url = f"{EUREKA_SERVER}/apps/{APP_NAME.upper()}/{INSTANCE_ID}"

    while True:
        time.sleep(30)
        try:
            res = requests.put(url)
            if res.status_code == 200:
                print("Eureka heartbeat OK (200)")
            elif res.status_code == 404:
                print("Eureka heartbeat 404 — re-registrando...")
                register_with_eureka()
                return
            else:
                print(f"Eureka heartbeat unexpected: {res.status_code}")
        except Exception as e:
            print(f"Eureka heartbeat failed: {e}")


def deregister_from_eureka():
    url = f"{EUREKA_SERVER}/apps/{APP_NAME.upper()}/{INSTANCE_ID}"
    try:
        res = requests.delete(url)
        print(f"Deregistered from Eureka: {res.status_code}")
    except Exception as e:
        print(f"Failed to deregister from Eureka: {e}")