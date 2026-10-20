# Deploy Satrn su server `zeroradiation`

Satrn gira sullo stesso server di Stellr (Ubuntu 24.04, Nginx, systemd) con lo
stesso modello di rilascio, ma in un'istanza completamente separata:

| | Stellr | Satrn |
|---|---|---|
| Utente di sistema | `4cDLb9STf6Vs` | `satrn` (dedicato, `nologin`) |
| Cartelle | `/opt/stellr/…` | `/opt/satrn/{app,releases,current,runtime}` |
| Servizio | `stellr-web.service` | `satrn-web.service` |
| Porta interna | 3001 | 3002 |
| Nginx | `sites-enabled/stellr` | `sites-enabled/satrn` |
| Dominio | `stellr.zeroradiation.eu` | `satrn.zeroradiation.eu` |
| Database | PostgreSQL locale | Supabase Cloud (nessun DB sul server) |
| Rilascio | `stellr-release` | `satrn-release` |

Questa cartella contiene solo configurazioni versionate: niente segreti.
I segreti stanno in `/opt/satrn/app/.env.local` (utente `satrn`, 0600) e
`/etc/satrn/monitoring.env` (root, 0600).

## Prima installazione (una tantum)

Sul server, con un utente sudo:

```bash
git clone https://github.com/gmnlmori-dev/satrn-app.git ~/satrn-setup
sudo bash ~/satrn-setup/deploy/bin/satrn-server-setup
```

Il checkout `~/satrn-setup` serve solo per (re)installare script e unit:
per aggiornarli, `git -C ~/satrn-setup pull` e rieseguire il setup.

Lo script è rieseguibile e:

- crea l'utente `satrn` e le cartelle `/opt/satrn/*`;
- scarica Node 24 in `/opt/satrn/runtime` (checksum verificato);
- clona il repo (branch `main`) in `/opt/satrn/app`;
- installa `satrn-release` e `satrn-health-heartbeat` in `/usr/local/sbin`;
- installa unit systemd, site Nginx (solo HTTP) e rate limit sul `/login`;
- crea i modelli `.env.local` e `monitoring.env` da compilare.

Poi, in ordine:

1. `sudo -u satrn nano /opt/satrn/app/.env.local` con:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (le `NEXT_PUBLIC_*` vengono inlinate in build:
   dopo una modifica serve un nuovo rilascio).
2. DNS su OVH: `satrn.zeroradiation.eu` verso il server (come `stellr`).
3. `sudo certbot --nginx -d satrn.zeroradiation.eu` (aggiunge 443 e redirect).
4. `sudo satrn-release` (primo rilascio, avvia il servizio).
5. Supabase → Authentication → URL Configuration: *Site URL* e *Redirect URLs*
   su `https://satrn.zeroradiation.eu`.
6. Healthchecks.io: nuovo check, Ping URL in `/etc/satrn/monitoring.env`, poi
   `sudo systemctl enable --now satrn-health-heartbeat.timer`.
   UptimeRobot: monitor HTTPS su `https://satrn.zeroradiation.eu/login`.

## Rilascio

Lo sviluppo avviene fuori dal server (workspace Windows → GitHub). Il rilascio
pubblica `origin/main`:

```bash
sudo satrn-release              # ultimo commit di origin/main
sudo satrn-release --ref v0.11.0  # un tag o uno sha specifico
```

Lo script, con lock su `/run/lock/satrn-release.lock`:

1. `git fetch` e fast-forward di `main` in `/opt/satrn/app` (come `satrn`);
2. crea la worktree `/opt/satrn/releases/<sha>`, copia `.env.local`,
   `npm ci` e `npm run build` come `satrn` con Node in `/opt/satrn/runtime`;
3. scambia `/opt/satrn/current` in modo atomico e riavvia `satrn-web.service`;
4. attende fino a 30 s HTTP 200 da `http://127.0.0.1:3002/api/health`;
   in caso di errore ripristina il symlink precedente e riavvia;
5. conserva le 3 release più recenti (mai quella attiva né quella di rollback).

Se cambia `deploy/bin/satrn-release` o le unit, rieseguire
`satrn-server-setup` dal checkout aggiornato: il rilascio non aggiorna quei file.

### Verifica

```bash
systemctl status satrn-web.service --no-pager
readlink -f /opt/satrn/current
curl --fail --silent http://127.0.0.1:3002/api/health
journalctl -u satrn-web.service -n 100 --no-pager
```

`/api/health` risponde 200 solo se anche Supabase è raggiungibile; dall'esterno
Nginx risponde 404.

## Monitoraggio

`satrn-health-heartbeat.timer` (ogni 2 minuti) controlla `/api/health` e pinga
Healthchecks.io solo se app e Supabase sono disponibili. Il Ping URL non è nel
repository.

## Backup

Il database è su Supabase Cloud (backup gestiti dal servizio). Sul server non
ci sono dati applicativi da salvare oltre a `.env.local`.
