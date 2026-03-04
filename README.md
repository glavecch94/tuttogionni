# TuttoGionni

App per tracciare allenamenti e impegni settimanali.

## Stack tecnologico

- **Backend**: Java 21, Spring Boot 3, Spring Security, JWT
- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Database**: PostgreSQL 16
- **Reverse proxy**: Caddy (HTTPS automatico via Let's Encrypt)
- **PWA**: Installabile su smartphone

---

## Produzione

- **URL**: https://tuttogionni.duckdns.org
- **Hosting**: Oracle Cloud Free Tier — VM.Standard.E2.1.Micro (1 OCPU, 1 GB RAM)
- **IP**: 89.168.17.232
- **SSH**: `ssh -i ~/Downloads/ssh-key-2026-03-04.key ubuntu@89.168.17.232`

### Deploy iniziale

```bash
ssh ubuntu@<IP>
git clone https://github.com/glavecch94/tuttogionni.git
cd tuttogionni
cp .env.example .env
nano .env   # compila i valori
docker compose -f docker-compose.prod.yml up -d --build
```

### Aggiornamento

```bash
ssh -i ~/Downloads/ssh-key-2026-03-04.key ubuntu@89.168.17.232
cd tuttogionni
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Variabili d'ambiente richieste (`.env`)

| Variabile | Descrizione |
|-----------|-------------|
| `DB_NAME` | Nome del database PostgreSQL |
| `DB_USERNAME` | Utente PostgreSQL |
| `DB_PASSWORD` | Password PostgreSQL |
| `JWT_SECRET` | Secret JWT (genera con `openssl rand -base64 64`) |
| `DOMAIN` | Dominio pubblico (es. `tuttogionni.duckdns.org`) |

### Gestione whitelist registrazioni

Solo le email presenti nella tabella `allowed_emails` possono registrarsi.

```bash
# Entra nel container postgres
docker exec -it tuttogionni-postgres-1 psql -U postgres -d tuttogionni

# Aggiungi un'email autorizzata
INSERT INTO allowed_emails (email) VALUES ('utente@esempio.com');

# Lista email autorizzate
SELECT * FROM allowed_emails;

# Rimuovi un'email
DELETE FROM allowed_emails WHERE email = 'utente@esempio.com';

\q
```

### Log e monitoring

```bash
# Stato di tutti i container
docker compose -f docker-compose.prod.yml ps

# Log in tempo reale
docker compose -f docker-compose.prod.yml logs -f

# Log di un servizio specifico
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy

# Utilizzo memoria
docker stats
```

### Comandi utili

```bash
# Ferma tutto
docker compose -f docker-compose.prod.yml down

# Ferma e cancella i volumi (ATTENZIONE: cancella il database)
docker compose -f docker-compose.prod.yml down -v

# Rebuild senza cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

---

## Sviluppo locale

### Con Docker

```bash
cp .env.example .env   # usa i valori di default per locale
docker compose up -d --build
```

| Servizio | URL |
|----------|-----|
| App | http://localhost |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/swagger-ui.html |

### Senza Docker

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

| Servizio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
