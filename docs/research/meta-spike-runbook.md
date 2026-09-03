# Zenovi — Runbook del spike técnico de Meta

Actualizado: 2026-09-03  
Estado: en ejecución; ruta Standard Access validada parcialmente con una cuenta Creator  
Responsable inicial: Joaco

## 1. Objetivo

Demostrar con datos reales si Instagram API with Instagram Login permite construir el núcleo orgánico del MVP sin exigir una Página de Facebook vinculada.

Este spike debe responder con evidencia, no con suposiciones:

- Qué cuentas pueden completar OAuth.
- Qué perfil y medios propios se pueden enumerar.
- Qué métricas devuelve cada tipo de contenido.
- Si Zenovi puede obtener el video autorizado para transcripción y análisis visual.
- Cómo se comportan Stories antes y después de expirar.
- Qué necesita la app para pasar de cuentas internas a beta testers externos.

## 2. Alcance fijo

Ruta primaria:

- Instagram API with Instagram Login.
- Host de API: `graph.instagram.com`.
- Cuenta profesional Business.
- Cuenta profesional Creator.
- Permisos iniciales: `instagram_business_basic` e `instagram_business_manage_insights`.

Fuera de este spike:

- Facebook Pages y Meta Ads.
- DMs.
- Lectura o moderación de comentarios individuales.
- Publicación automática.
- Competidores y scraping.
- Modelos de IA y calidad del análisis.

El número agregado de comentarios sí se registra si el objeto o los insights lo entregan.

## 3. Única preparación manual en Meta

> Bloqueo operativo registrado el 2026-08-31: el flujo de alta de Meta for Developers no entregó el SMS al fundador principal, aun repitiendo el flujo en navegadores distintos. El número ya fue validado por el equipo y no se seguirá modificando. Este incidente bloquea la creación manual de la app, pero no invalida la viabilidad documental de Instagram Login. Por decisión del fundador, el alta inicial permanecerá en su cuenta personal real; no se crearán cuentas duplicadas ni se derivará el registro.

Abrir [Meta for Developers](https://developers.facebook.com/apps/) y crear una app nueva orientada a empresa/negocio. No pegar en este repositorio el App Secret, códigos OAuth ni access tokens.

Registrar en el acta del spike:

- Nombre visible: `Zenovi Development`.
- App ID: puede documentarse; no es un secreto.
- Tipo/caso de uso seleccionado en el dashboard.
- Business Portfolio asociado, si Meta lo exige.
- Producto agregado: Instagram.
- Ruta configurada: Instagram API with Instagram Login / Business Login for Instagram.
- Versión de Graph API que muestra el dashboard.
- Fecha de creación.

Configurar dos redirect URIs exactas cuando exista un callback real:

- Desarrollo local mediante una URL HTTPS controlada.
- Staging bajo un subdominio de `zenovi.app`.

No usar redirects genéricos, comodines ni producción para pruebas locales.

## 4. Cuentas de prueba necesarias

| Cuenta | Requisito | Contenido mínimo |
|---|---|---|
| Business controlada | Profesional, pública y administrada por el equipo | 3 Reels, 1 carrusel, 1 imagen y una secuencia de 3 Stories |
| Creator controlada | Profesional, pública y administrada por el equipo | Creada el 2026-08-31; ya contiene 1 Reel, 1 post y 1 carrusel. Pendiente: secuencia de 3 Stories y contenido adicional si la primera corrida exige más variedad |
| Externa | Profesional y no administrada por el equipo | Se usa únicamente después del camino de Advanced Access |

Cada cuenta controlada debe incluir al menos:

- Un Reel reciente con caption y CTA.
- Un Reel con comentarios.
- Un Reel con suficientes días para comparar métricas.
- Una Story de imagen.
- Una Story de video.
- Una Story con interacción o CTA si Instagram lo permite.

No usar cuentas personales ni contenido privado de terceros.

Tampoco usar como cuenta API inicial el Instagram personal, comercial o de marca principal de ninguno de los socios. Las cuentas Business y Creator del spike deben ser cuentas profesionales dedicadas a pruebas, creadas con correo recuperable propio y sin audiencia, activos publicitarios ni negocio crítico. El Facebook personal se utiliza como identidad de desarrollador; no se autoriza automáticamente su Instagram asociado.

## 5. Matriz de capacidades a ejecutar

| ID | Capacidad | Permiso esperado | Evidencia a guardar | Resultado |
|---|---|---|---|---|
| META-01 | Iniciar y completar OAuth | Basic + Insights | URL sin secretos, scopes consentidos y timestamps | Validado manualmente con Creator evaluadora |
| META-02 | Resolver identidad profesional | Basic | ID, username y tipo de cuenta redactados | Validado con Creator |
| META-03 | Enumerar medios con paginación | Basic | Campos y cursores devueltos | Validado en tres páginas forzadas con `limit=1`; profundidad histórica pendiente |
| META-04 | Distinguir Reel, imagen, video y carrusel | Basic | `media_type` y `media_product_type` reales | Validado para Reel, imagen, carrusel y Stories de imagen/video |
| META-05 | Obtener caption, permalink, thumbnail y timestamp | Basic | Matriz de campos por tipo | Matriz validada para Reel, imagen y carrusel; campos ausentes tratados como opcionales |
| META-06 | Obtener media autorizada para procesamiento | Basic | Tipo de URL, expiración y descarga desde servidor | Reel MP4 completo con duración, Story MP4 e imagen/Story/slides JPEG validados; expiración pendiente |
| META-07 | Consultar insights de cuenta | Insights | Métricas, periodos, vacíos y errores | Valores reales validados con `total_value`; follower history/follows vacíos bajo 100 seguidores |
| META-08 | Consultar insights de Reels | Insights | Views, reach, likes, comments, shares, saves y tiempos disponibles | Core validado en ambas rutas; visitas, actividad, follows y `follow_type` incompatibles; Facebook Login añade `reposts`, pero no curva, fuentes ni demografía por Reel |
| META-09 | Enumerar Stories activas | Basic/Insights | IDs, campos y media disponible | Validado para imagen y video activos |
| META-10 | Consultar insights de Stories | Insights | Replies, navigation, views/reach y disponibilidad real | Imagen/video validados; reply real visible a nivel de cuenta pero no de Story individual |
| META-11 | Reconsultar una Story expirada | Basic/Insights | Estado a 24, 48 y 72 horas | Pendiente crítico |
| META-12 | Cancelar, denegar y revocar OAuth | Basic + Insights | Estado interno y error mostrado | Pendiente |
| META-13 | Reconectar sin duplicar workspace/cuenta | Basic + Insights | Logs e idempotencia | Pendiente |
| META-14 | Conectar cuenta externa | Advanced Access | Resultado del flujo aprobado | Bloqueado hasta revisión |

## 6. Casos mínimos de OAuth

Probar en desktop y móvil:

1. Consentimiento completo.
2. Usuario cancela antes de aceptar.
3. Usuario deniega Insights y acepta Basic, si Meta ofrece granularidad.
4. Callback con `state` inválido.
5. Callback repetido.
6. Token inválido o revocado.
7. Cuenta personal/no elegible.
8. Cuenta Creator elegible.
9. Cuenta Business elegible.
10. Reconexión de una cuenta ya vinculada.

Estados internos esperados:

`not_connected -> oauth_started -> consent_received -> token_verified -> account_resolved -> initial_sync_queued -> active`

Los errores deben conservar el último estado válido y ofrecer una acción concreta.

## 7. Evidencia y seguridad

Guardar únicamente:

- Timestamp UTC.
- Versión de API.
- Tipo de cuenta.
- Endpoint y parámetros no sensibles.
- Status HTTP.
- Campos presentes/ausentes.
- Error sanitizado.
- Latencia.
- Resultado esperado frente a real.

Nunca guardar en Markdown, capturas, issues o logs:

- App Secret.
- Access token.
- Authorization code.
- URL completa del callback con parámetros.
- Cookies o cabeceras de sesión.

Las respuestas de prueba deben sanitizar IDs y usernames antes de compartirse.

## 8. Criterio de aprobación

El spike se aprueba solamente cuando:

- Business y Creator completan el flujo.
- Se enumeran medios y métricas suficientes para el detalle de Reels.
- Al menos un Reel se puede procesar por una ruta autorizada.
- Stories tiene una decisión basada en pruebas reales.
- Cancelación, revocación y reconexión funcionan sin datos cruzados.
- Existe un camino documentado de Advanced Access para beta testers externos.

Si falla la descarga del Reel, se evalúa una carga manual como fallback. Si fallan Stories, se degradan o salen del MVP; no se inventan datos.

## 9. Primer bloque ejecutable

- [x] Crear la app de desarrollo de Zenovi en Meta for Developers.
- [x] Registrar App ID, versión y tipo/caso de uso sin secretos.
- [x] Agregar Instagram y seleccionar Instagram Login.
- [ ] Preparar una cuenta Business controlada.
- [x] Preparar una cuenta Creator controlada.
- [-] Publicar el contenido mínimo de prueba; Reel, imagen, carrusel y Stories de imagen/video disponibles, faltan variaciones e interacción controlada.
- [ ] Definir callback HTTPS de desarrollo.
- [-] Ejecutar META-01 a META-08 con Standard Access; primera corrida Creator completada, faltan variaciones y Business.
- [-] Ejecutar META-09 a META-13; META-09/10 completados, META-11/12/13 pendientes.
- [ ] Preparar App Review y Advanced Access para META-14.

## 10. Paquete mínimo para App Review

Preparar un paquete separado por permiso. Meta debe poder observar el uso concreto de cada permiso solicitado.

### `instagram_business_basic`

- Explicación: conectar una cuenta profesional elegida por su propietario y mostrar su perfil y contenido propio dentro de Zenovi.
- Screencast: usuario desconectado -> botón de conexión -> consentimiento -> selección/resolución de cuenta -> listado de sus medios.
- Evidencia: campos mostrados en interfaz y llamada exitosa sanitizada.
- Exclusión explícita: Zenovi no solicita contraseña ni acceso a cuentas personales.

### `instagram_business_manage_insights`

- Explicación: obtener métricas propias para diagnosticar rendimiento y recomendar mejoras de contenido.
- Screencast: cuenta conectada -> Reel real -> métricas -> diagnóstico que utiliza esas métricas.
- Evidencia: endpoint, métricas disponibles, respuesta vacía controlada y tratamiento de dato ausente.
- Exclusión explícita: Zenovi no usa este permiso para anuncios, DMs ni moderación.

### Material transversal

- URL pública y estable de la aplicación de revisión.
- Cuenta de revisión con instrucciones reproducibles y datos suficientes.
- Política de privacidad, condiciones, contacto y mecanismo de eliminación de datos accesibles sin iniciar sesión.
- Flujo visible de desconexión y revocación.
- Justificación independiente para cada permiso; no reutilizar una descripción genérica.
- Screencast completo desde estado desconectado y con el idioma de interfaz coherente.
- Lista de dominios, redirect URIs y versión de Graph API exactas.
- Confirmación de que secrets y tokens permanecen exclusivamente en servidor.

La solicitud de Advanced Access se presenta solo cuando el flujo mostrado funciona de extremo a extremo con Standard Access y activos de prueba permitidos.

## 11. Fuentes oficiales

- [Meta — Instagram API](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api)
- [Meta — Instagram Login](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login)
- [Meta — Insights](https://www.postman.com/meta/instagram/folder/23987686-f659d7d1-d74c-44e4-9192-9b1e8694c511)
