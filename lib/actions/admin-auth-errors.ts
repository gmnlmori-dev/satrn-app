/** Messaggi Auth Admin API in italiano dove possibile. */
export function mapAdminAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already been registered") || m.includes("already exists")) {
    return "Questa email è già registrata.";
  }
  if (m.includes("password") && (m.includes("weak") || m.includes("short"))) {
    return "Password troppo debole: usa almeno 8 caratteri.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "Indirizzo email non valido.";
  }
  if (m.includes("user not found")) {
    return "Utente non trovato.";
  }
  return message;
}

export const MIN_PASSWORD_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`;
  }
  return null;
}

export function assertSelfAdminGuards(
  actorUserId: string,
  targetUserId: string,
  patch: { role?: string; is_active?: boolean },
): string | null {
  if (targetUserId !== actorUserId) return null;
  if (patch.is_active === false) {
    return "Non puoi disattivare il tuo stesso utente admin.";
  }
  if (patch.role !== undefined && patch.role !== "admin") {
    return "Non puoi rimuovere il ruolo admin a te stesso.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return "L’email è obbligatoria.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return "Indirizzo email non valido.";
  }
  return null;
}
