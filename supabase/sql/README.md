# Migrazioni SQL manuali (Supabase)

Gli script in questa cartella **non** hanno runner automatico: vanno eseguiti manualmente nel **SQL Editor** di Supabase (prod/staging) nell'ordine indicato.

## Ordine consigliato

1. `teams.sql` — team, profili, RLS base multi-team
2. `roles_profiles_assignment.sql` — ruoli, enum activity `assigned_user_changed`
3. `request_assignees.sql` — junction multi-assegnatario richieste
4. `request_activities.sql` — timeline richieste (policy ristrette da `teams.sql`)
5. `inbox_items.sql` — inbox (policy ristrette da `teams.sql`)
6. `inbox_assigned_user.sql` / `inbox_created_by.sql` — assegnazione e autore inbox
7. `request_created_by.sql` — autore richiesta
8. `tasks.sql` — task libere e assignees
9. `team_notes.sql` — note team
10. `team_notes_sort_order.sql` — ordinamento note
11. `team_notes_rls_fix.sql` — correzioni RLS note
12. `team_note_cross_team_sharing.sql` — `team_note_shared_teams` + RLS condivisione cross-team
13. `profile_preferences.sql` — preferenze utente (es. scope default Da seguire)
14. `app_announcements.sql` — novità app e letture
15. `app_announcement_reads_update_policy.sql` — solo se prod ha già `app_announcements.sql` senza policy UPDATE

## Checklist deploy produzione

Confrontare lo schema Supabase prod con le dipendenze del codice:

| Script | Cosa verifica |
|--------|----------------|
| `team_note_cross_team_sharing.sql` | Tabella `team_note_shared_teams`, RLS note con team condivisi |
| `request_assignees.sql` | Tabella `request_assignees`, trigger sync `assigned_user_id` |
| `roles_profiles_assignment.sql` | Valore enum `assigned_user_changed` in `request_activity_type` |
| `app_announcement_reads_update_policy.sql` | Upsert letture novità (`markAnnouncementRead`) |

## Gap RLS noti (mitigati lato app)

- **Assignees junction**: RLS permette mutazioni a tutti nel team; l'app limita a admin/manager — bypass possibile via API diretta (RLS più restrittiva richiede migrazione dedicata).
- **Migrazioni out-of-order**: `inbox_items.sql` / `request_activities.sql` hanno policy aperte finché non si applica `teams.sql`.

## Verifica post-deploy

```sql
-- Enum activity
SELECT unnest(enum_range(NULL::request_activity_type));

-- Tabelle condivisione note
SELECT to_regclass('public.team_note_shared_teams');

-- Policy letture novità
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'app_announcement_reads';
```

Dovrebbero comparire `assigned_user_changed`, la tabella shared teams, e policy SELECT/INSERT/UPDATE per l'utente corrente.
