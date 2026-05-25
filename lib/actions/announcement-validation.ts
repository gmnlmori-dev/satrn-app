import type { AnnouncementAudience } from "@/types/announcement";
import { fromDatetimeLocalValue } from "@/lib/date";

export type AnnouncementInput = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  target_team_id?: string;
  target_user_id?: string;
  starts_at?: string | null;
  ends_at?: string | null;
};

export function parseAnnouncementInput(
  params: AnnouncementInput,
):
  | {
      ok: true;
      data: {
        title: string;
        body: string;
        audience: AnnouncementAudience;
        target_team_id: string | null;
        target_user_id: string | null;
        starts_at: string | null;
        ends_at: string | null;
      };
    }
  | { ok: false; message: string } {
  const title = params.title.trim();
  const body = params.body.trim();

  if (!title) {
    return { ok: false, message: "Il titolo è obbligatorio." };
  }
  if (!body) {
    return { ok: false, message: "Le note di aggiornamento sono obbligatorie." };
  }

  const audience = params.audience;
  if (audience !== "all" && audience !== "team" && audience !== "user") {
    return { ok: false, message: "Destinatari non validi." };
  }

  const targetTeamId = params.target_team_id?.trim() || null;
  const targetUserId = params.target_user_id?.trim() || null;

  if (audience === "team" && !targetTeamId) {
    return { ok: false, message: "Seleziona un team destinatario." };
  }
  if (audience === "user" && !targetUserId) {
    return { ok: false, message: "Seleziona un utente destinatario." };
  }
  if (audience === "all" && (targetTeamId || targetUserId)) {
    return { ok: false, message: "Destinatari non coerenti con «Tutti»." };
  }

  const startsAt = normalizeOptionalIso(params.starts_at);
  if (startsAt === "invalid") {
    return { ok: false, message: "Data di attivazione non valida." };
  }
  const endsAt = normalizeOptionalIso(params.ends_at);
  if (endsAt === "invalid") {
    return { ok: false, message: "Data di disattivazione non valida." };
  }

  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return {
      ok: false,
      message: "La disattivazione deve essere successiva all'attivazione.",
    };
  }

  return {
    ok: true,
    data: {
      title,
      body,
      audience,
      target_team_id: audience === "team" ? targetTeamId : null,
      target_user_id: audience === "user" ? targetUserId : null,
      starts_at: startsAt,
      ends_at: endsAt,
    },
  };
}

function normalizeOptionalIso(
  value: string | null | undefined,
): string | null | "invalid" {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes("T")) {
    const iso = fromDatetimeLocalValue(trimmed);
    return iso ?? "invalid";
  }

  const t = new Date(trimmed).getTime();
  if (Number.isNaN(t)) return "invalid";
  return new Date(t).toISOString();
}

export function revalidateAnnouncementPaths() {
  return ["/app/settings/announcements", "/app/novita", "/app"] as const;
}
