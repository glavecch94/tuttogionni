# TuttoGionni

App per tracciare allenamenti e impegni settimanali.

## Requisiti
- Docker e Docker Compose

## URL

| Servizio | URL |
|----------|-----|
| App | http://localhost |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger-ui.html |

## Comandi utili
# Ribuilda eliminando la cache
```bash
docker compose build --no-cache && docker compose up -d
```
# Ferma i servizi
```bash
docker compose down
```
# Ferma e rimuovi i volumi (cancella il database)
```bash
docker compose down -v
```bash
```
# Visualizza i log
```bash
docker compose logs -f
```
# Log di un servizio specifico
```bash
docker compose logs -f backend
```
# Log di un servizio specifico
```bash
docker compose logs -f frontend
```

## Sviluppo locale

Se preferisci avviare backend e frontend separatamente:

```bash
# 1. Avvia solo PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# 2. Backend (richiede Java 21 e Maven)
cd backend
./mvnw spring-boot:run

# 3. Frontend (richiede Node.js 20+)
cd frontend
npm install
npm run dev
```

In modalità sviluppo:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## Stack tecnologico

- **Backend**: Java 21, Spring Boot 3, Spring Security, JWT
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Database**: PostgreSQL 16
- **PWA**: Installabile su smartphone
