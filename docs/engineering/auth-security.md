# Baseline de seguridad de autenticación

Estado: decisión de arquitectura para el MVP. Los controles que dependen del proyecto remoto de Supabase permanecen pendientes de verificación.

## Alcance actual

- Zenovi ofrece Google OAuth y correo más contraseña mediante Supabase Auth.
- Registro, inicio de sesión y recuperación son flujos separados. La confirmación de correo debe permanecer habilitada.
- La aplicación exige 8 caracteres como mínimo; el mismo mínimo se configura en Supabase para que también rija sobre llamadas directas a Auth. No se imponen reglas de composición que incentiven patrones predecibles.

## Respuestas y privacidad

- El registro devuelve una respuesta genérica tanto para un correo existente como para uno nuevo. La recuperación hace lo mismo exista o no una cuenta.
- El inicio de sesión no distingue entre correo inexistente, contraseña incorrecta o cuenta todavía no confirmada.
- El cliente nunca presenta errores crudos de Supabase, identificadores internos ni detalles de configuración.
- La validación local puede indicar formato de correo inválido porque no revela si existe una cuenta.
- Los logs no deben registrar contraseñas, tokens, enlaces de recuperación, códigos OAuth ni correos completos. Los eventos operativos usarán identificadores internos y un correlation ID.

## Sesión y callbacks

- El servidor valida identidad con claims o usuario verificado; no confía en datos de sesión sin validar.
- Los redirects posteriores al acceso sólo aceptan rutas internas conocidas.
- OAuth usa el flujo PKCE de Supabase. No se implementan callbacks propios que omitan la validación del código.
- No se vinculan identidades por una comparación manual de correo. El linking queda en manos de Supabase y de correos verificados.
- Las credenciales privilegiadas, incluida `service_role`, son exclusivamente server-only y nunca usan prefijo público.

## Supabase antes de una beta externa

- Verificación pública del 8 de septiembre de 2026: email habilitado, registro abierto y confirmación de correo activa (`mailer_autoconfirm: false`). Google permanece oculto hasta habilitar el proveedor remoto.
- Confirmación de correo habilitada cuando corresponda al flujo elegido.
- Enlaces de confirmación y recuperación con caducidad de una hora o menos.
- Rate limits revisados para Auth y endpoints propios.
- CAPTCHA o protección equivalente activada antes de abrir el registro públicamente.
- SMTP propio configurado y probado; el servicio de correo de prueba no es infraestructura de producción.
- URLs de sitio y redirects reducidas a una allowlist exacta por ambiente.
- MFA se evalúa para administradores y operaciones sensibles, sin bloquear el primer MVP.

## RLS y aislamiento

- Toda tabla con datos de cliente debe tener `workspace_id` y RLS antes de recibir datos reales.
- `profiles`, `workspaces` y `memberships` empiezan con RLS habilitado y privilegios explícitos.
- Las funciones `security definer` viven fuera de esquemas expuestos, fijan un `search_path` vacío y no son ejecutables por clientes.
- No se considera terminada la base hasta ejecutar tests negativos: anónimo sin acceso; usuario A sin lectura o escritura sobre B; imposibilidad de reasignar ownership; imposibilidad de crear un segundo workspace en el MVP.

## Gate de aplicación

La migración local `supabase/migrations/20260908160608_initial_auth_workspace.sql` no debe aplicarse a otro proyecto por conveniencia. Se ejecutará únicamente cuando el proyecto Zenovi correcto esté visible y se verificará después con tests negativos y los asesores de seguridad y rendimiento de Supabase.
