export interface AuthenticatedUser {
  user_id: string;
  email: string;
  rol: string;
  /** Bearer token original del usuario, para reenviar a llamadas autenticadas (p. ej. identity GET /users/:id). */
  token: string;
}
