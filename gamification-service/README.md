# Gamification service

1. Install dependencies

```bash
# Para poder ejecutar proyectos de fastAPI
$ pip install fastapi uvicorn

# Intalar dependencias
pip install -r requirements.txt
```

2. Configurar variables de entorno

```bash
$ cp .env.example .env
```

2. Execute (estando en /gamification-service):

```bash
$ uvicorn app.main:app --reload
```
