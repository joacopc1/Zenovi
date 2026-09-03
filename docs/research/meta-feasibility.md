# Zenovi — Viabilidad de Meta e Instagram

Actualizado: 2026-09-03  
Estado: spike Standard validado parcialmente con una cuenta Creator propia  
Prioridad: gate crítico del producto

## 1. Veredicto provisional

El núcleo orgánico de Zenovi es técnicamente viable mediante la API oficial de Instagram para una cuenta Creator propia bajo Standard Access. La viabilidad de producción todavía depende de Stories, cuentas Business, OAuth implementado por Zenovi, Advanced Access y una cuenta externa.

La ruta recomendada para el MVP es **Instagram API with Instagram Login** porque:

- Permite conectar cuentas profesionales Business y Creator.
- No exige una Página de Facebook vinculada para el núcleo orgánico.
- Permite solicitar acceso al perfil, contenido propio e insights.
- Reduce la fricción frente a Facebook Login for Business.

La ruta **Instagram API with Facebook Login** debe mantenerse como integración separada o futura para capacidades que dependan de páginas, anuncios o etiquetado. La comparación real no desbloqueó visitas al perfil ni follows por Reel; únicamente añadió `reposts`. No debería condicionar el onboarding orgánico inicial.

El gate continúa abierto hasta probar el OAuth propio de Zenovi, Stories, una cuenta Business y al menos una cuenta externa. La lectura de perfil, medios e insights de Reel ya fue comprobada con una Creator.

## 1.1 Evidencia real del spike — 2026-09-03

Prueba realizada con Graph API `v23.0`, Instagram Login, una cuenta Creator propia agregada como evaluadora y los permisos mínimos `instagram_business_basic` e `instagram_business_manage_insights`.

- La autorización permitió excluir mensajes, comentarios y publicación.
- El token resolvió correctamente username, tipo `MEDIA_CREATOR`, cantidad de medios, seguidores y seguidos.
- La API enumeró los tres contenidos publicados: un Reel, una imagen de feed y un carrusel de seis imágenes.
- La paginación se forzó con `limit=1` y recorrió tres páginas consecutivas —carrusel, imagen y Reel— sin duplicados; cada página conservó tipo, producto y timestamp.
- Los tres medios devolvieron `views`, `reach`, `likes`, `comments`, `saved`, `shares` y `total_interactions`.
- El Reel devolvió valores reales aun con cero seguidores: 109 reproducciones y 103 cuentas alcanzadas al momento de la consulta.
- El Reel devolvió `ig_reels_video_view_total_time` e `ig_reels_avg_watch_time`; el promedio informado fue 5.895 ms.
- En una consulta posterior, el Reel alcanzó 114 visualizaciones y 104 cuentas; `reels_skip_rate` devolvió 40,8 %, definido por Meta como la proporción de visualizaciones que omitieron el Reel durante los primeros tres segundos.
- Una comparación posterior contra Insights nativos mostró paridad exacta en ese instante: 120 views, 104 cuentas alcanzadas, 1 like, 1 comentario, 0 guardados, 0 shares y 41,9 % de skip rate. El promedio API fue 5,935 s y la app lo mostró redondeado como 5 s.
- El objeto del Reel entregó permalink, miniatura, timestamp y una URL multimedia autorizada. La URL respondió como `video/mp4` y permitió una lectura parcial sin conservar el archivo; el caption estuvo ausente porque la publicación de prueba no tenía texto.
- También se completó una descarga temporal del Reel (aprox. 6,1 MB) y se extrajo una duración de 66,41 s con herramientas multimedia locales. Frente a un `ig_reels_avg_watch_time` de 5,895 s, Zenovi puede derivar una retención media aproximada de 8,9 %. Este porcentaje es calculado por Zenovi, no entregado directamente por Meta; el archivo temporal se eliminó al finalizar.
- La imagen individual del feed y los seis elementos del carrusel entregaron URLs autorizadas independientes. Los siete recursos respondieron como `image/jpeg` y permitieron lecturas parciales, confirmando que Zenovi puede procesar cada slide por separado.
- Una primera consulta agrupada de cuenta sin `metric_type=total_value` devolvió únicamente `reach`. Al consultar cada métrica correctamente y por separado, aparecieron valores reales para views, reach, profile views, accounts engaged, interacciones, likes, comentarios, shares, saves, replies y taps; esto confirma que parámetros y granularidad forman parte del contrato de cada métrica.
- La ruta `/stories` enumeró una Story activa de imagen y la clasificó como `media_product_type=STORY`.
- La Story devolvió `views`, `reach`, `replies`, `navigation`, `total_interactions` y `shares`; registró 2 visualizaciones al momento de la consulta.
- La URL multimedia autorizada de la Story estuvo disponible y respondió como `image/jpeg`; se validó una lectura parcial sin conservar el archivo.
- Una segunda Story de video fue enumerada correctamente como `media_type=VIDEO` y `media_product_type=STORY` inmediatamente después de publicarse.
- La Story de video devolvió `views`, `reach`, `replies`, `navigation`, `total_interactions` y `shares`. Tras verla desde otra cuenta, `views` pasó de 0 a 1 en la siguiente consulta, mientras `reach` permaneció temporalmente en 0; Zenovi no debe asumir actualización simultánea entre métricas.
- Su URL multimedia autorizada respondió como `video/mp4`; se validó una lectura parcial sin conservar el archivo.
- Después de seguir la cuenta desde otro perfil, `followers_count` se actualizó de 0 a 1 en la siguiente consulta, confirmando que el conteo básico refleja cambios recientes sin exigir un mínimo de 100 seguidores.
- La segunda lectura de publicaciones reflejó actualizaciones reales: el carrusel devolvió 1 view, 1 reach, 1 like y 1 total interaction; la imagen devolvió 1 view y 1 reach. `like_count` e Insights coincidieron al reconsultarse.
- Se publicó un comentario controlado y se registró un like en el Reel. `comments_count` y el insight `comments` devolvieron 1, `like_count` y `likes` devolvieron 1, y `total_interactions` devolvió 2. La prueba usó únicamente Basic + Insights y no solicitó el texto ni la identidad del comentarista.
- Al guardar el mismo Reel desde la cuenta de control, `saved` pasó de 0 a 1 y `total_interactions` de 2 a 3, mientras likes, comentarios y shares permanecieron sin cambios. Esto confirma que el guardado se incorpora al total agregado.
- Al retirar el guardado, `saved` volvió de 1 a 0 y `total_interactions` de 3 a 2. Las métricas son snapshots mutables y pueden disminuir; Zenovi no debe acumular deltas como si fueran contadores monotónicos.
- El Reel se envió una vez por mensaje directo durante la prueba, pero tanto Insights nativos como la API permanecieron en `shares=0`. Ese envío concreto no fue contabilizado como share; no constituye una discrepancia entre superficies.
- `follows`, `profile_visits` y `profile_activity` se probaron individualmente. Las tres funcionan para Story, imagen y carrusel, pero sobre el Reel devuelven error 100 por no ser compatibles con `media_product_type=REELS` en Instagram Login v23.0. La app nativa puede mostrar datos no expuestos por esta API; antes de cerrar la atribución por Reel se deberá comparar la ruta alternativa de Facebook Login.
- Las capturas de Insights nativos del mismo Reel mostraron `Visitas al perfil=3` y `Nuevos seguidores=0`, además de curva de retención, fuentes de visualización, proporción seguidores/no seguidores y demografía por edad, país y sexo. `reposts` fue rechazado por la API para el Reel y los breakdowns agregados de `reached_audience_demographics` por país, edad y género devolvieron conjuntos vacíos.
- También se probaron `views` y `reach` con `breakdown=follow_type`; ambos devolvieron error 100 por desglose incompatible. La separación seguidores/no seguidores visible en la app nativa no se obtiene añadiendo ese parámetro en Instagram Login v23.0.
- Se vinculó la misma cuenta Creator a una Página de Facebook de prueba y se autorizó una segunda ruta con `pages_show_list`, `pages_read_engagement`, `instagram_basic` e `instagram_manage_insights`. El token de usuario fue válido y sus permisos granulares apuntaron explícitamente a la Página y cuenta de Instagram seleccionadas. Aunque `/me/accounts` devolvió una lista vacía, la consulta directa a la Página autorizada entregó su Page Access Token y el mismo IG User ID; la enumeración posterior devolvió los mismos tres medios.
- Se ejecutó una matriz controlada entre Instagram Login y Facebook Login en `v23.0` y `v26.0`. `profile_visits`, `profile_activity` y `follows` devolvieron el mismo error 100 de incompatibilidad con Reels en las cuatro combinaciones. `views` y `reach` con `breakdown=follow_type` también fueron incompatibles mediante Facebook Login. Esto descarta que un permiso adicional o la ruta alternativa expongan la atribución de seguidores o la división seguidores/no seguidores por Reel.
- Facebook Login sí devolvió `reposts=0` para el Reel tanto en `v23.0` como en `v26.0`, mientras Instagram Login rechazó la métrica en ambas versiones. La diferencia depende de la ruta de autenticación, no de la versión. El resto del núcleo mantuvo paridad: en la consulta comparativa Facebook Login devolvió 123 views, 104 reach, 1 like, 1 comentario, 0 guardados, 0 shares, 2 interacciones, 6,058 s de reproducción media, 660,395 s acumulados y 41,5 % de skip rate.
- Durante una prueba posterior, `followers_count` del perfil pasó de 1 a 3 y el Reel de 120 a 121 views. Sin embargo, las cuentas siguieron el perfil después de navegar hasta él y no mediante el botón contextual del Reel; Instagram nativo mantuvo `Nuevos seguidores=0`. Este evento valida el conteo general, pero no constituye un control positivo de atribución al Reel.
- La documentación oficial lista `follower_count` y `follows_and_unfollows` como insights de cuenta, no como una atribución causal a una publicación. Tampoco documenta una suscripción webhook de nuevos seguidores; los eventos de seguidores que aparecen en la API de mensajería solo permiten conocer el estado de seguimiento de una persona que ya interactuó y dio contexto de mensajería. No resuelven el seguimiento global ni la atribución por Reel.
- Se envió una respuesta de texto controlada a la Story de video desde otra cuenta. Instagram la entregó como “Respondió a tu historia” y el insight de cuenta devolvió `replies=1`, pero la Story individual permaneció en `replies=0`. Zenovi puede medir respuestas agregadas sin leer DMs, pero no debe atribuirlas a una Story concreta mientras esa granularidad no resulte consistente.
- Las respuestas incluyeron la cabecera `x-app-usage` con `call_volume` y `cpu_time`; ambos valores fueron 0 durante la prueba. Zenovi deberá registrar estas señales para controlar la frecuencia de sincronización.
- No se activaron webhooks ni permisos de escritura.

Conclusión de esta prueba: conexión, perfil, clasificación de medios e insights esenciales de Reel funcionan sin Página de Facebook y sin alcanzar 100 seguidores. La cuenta comenzó con cero seguidores y pasó a uno durante la prueba; varias métricas de cuenta funcionaron, pero `follower_count` histórico y `follows_and_unfollows` permanecieron vacíos.

## 2. Lo confirmado documentalmente

### Cuentas compatibles

- La API trabaja con cuentas profesionales de Instagram: Business y Creator.
- Las cuentas personales no son compatibles con insights ni con el núcleo previsto.
- Instagram Login no requiere una Página de Facebook vinculada.
- Facebook Login sí utiliza una cuenta profesional vinculada a una Página.

### Permisos mínimos provisionales

Para Instagram Login y el MVP orgánico:

- `instagram_business_basic`: identidad profesional y acceso básico permitido.
- `instagram_business_manage_insights`: insights de cuenta y medios propios.

Para la comparación mediante Facebook Login se validaron:

- `pages_show_list` y `pages_read_engagement`.
- `instagram_basic` e `instagram_manage_insights`.

No se necesitó `business_management`, `read_insights`, publicación, comentarios ni mensajes.

No se solicitarán inicialmente:

- `instagram_business_manage_messages`.
- `instagram_business_manage_comments`.
- `instagram_business_content_publish`.

Estos permisos no son necesarios para analizar contenido propio y aumentarían el alcance del consentimiento y de la revisión.

### Acceso para beta testers externos

- Standard Access sirve para cuentas propias o administradas y agregadas al App Dashboard.
- Advanced Access es necesario cuando la aplicación atiende cuentas profesionales que el equipo no posee ni administra.
- Por lo tanto, una prueba interna puede comenzar antes con cuentas de los socios o de clientes administrados y configurados como activos de prueba, pero una beta normal con creadores externos requiere completar el camino de Advanced Access correspondiente.
- `Standard` y `Advanced` describen el nivel de acceso aprobado para la app; no describen cuánto control tiene Zenovi sobre el negocio del creador.
- Un beta tester externo inicia OAuth, ve los permisos solicitados y autoriza a Zenovi a consultar únicamente esos datos mediante un token revocable. Zenovi no recibe su contraseña, no necesita ser socio de su negocio y no obtiene control general sobre su cuenta de Meta.
- El hecho de ofrecer meses gratuitos o denominarlo `beta` no crea una excepción: si la persona no administra la app ni el equipo administra su cuenta, se considera una cuenta externa.

### Comentarios y señales de intención

Hay que separar dos capacidades:

- La cantidad agregada de comentarios de una pieza puede formar parte de los datos básicos/insights sin leer el contenido de cada comentario.
- Leer, recibir por webhook, responder, ocultar o moderar comentarios individuales requiere `instagram_business_manage_comments` y un alcance de consentimiento mayor.

El texto de los comentarios podría ayudar a detectar señales de intención —por ejemplo, una palabra clave solicitando información—, pero un comentario no equivale automáticamente a un lead. Zenovi necesitaría una definición verificable de lead y, para atribuir su avance, una señal posterior como DM consentido, formulario, CRM, llamada o carga manual.

Decisión provisional: no solicitar el permiso de comentarios en la primera conexión del MVP. Diseñarlo como permiso progresivo opcional o experimento de fase posterior, sin bloquear las analíticas orgánicas básicas.

### Insights disponibles como familia de capacidades

La documentación oficial expone insights de cuenta y de medios propios. Entre las métricas listadas actualmente aparecen:

- Cuenta: `reach`, `follower_count`, `profile_views`, `accounts_engaged`, `total_interactions`, `likes`, `comments`, `shares`, `saves`, `replies`, `follows_and_unfollows`, `profile_links_taps` y `views`, entre otras.
- Medios: `views`, `reach`, `likes`, `comments`, `shares`, `saved`, `replies`, `total_interactions`, `navigation`, `ig_reels_video_view_total_time`, `ig_reels_avg_watch_time` y `reels_skip_rate`, entre otras.

Esta lista no significa que todas las métricas existan para todos los tipos de contenido, cuentas o versiones. La matriz final deberá registrar disponibilidad real por `media_type`, `media_product_type`, tipo de cuenta y versión de API.

### Limitaciones confirmadas

- Los insights solo corresponden a medios propios de cuentas profesionales.
- Algunas métricas de cuenta no están disponibles para perfiles con menos de 100 seguidores. Esto es una limitación de completitud de ciertos datos, no una restricción general de conexión ni un criterio relevante para el ICP premium de Zenovi.
- Meta conserva métricas de usuario por un máximo documentado de 90 días.
- Cuando un insight no existe o no está disponible, la API puede devolver un conjunto vacío; Zenovi no debe convertirlo en cero.
- Los valores agregados orgánicos pueden excluir actividad impulsada por anuncios.
- Instagram Login no ofrece acceso a Ads ni tagging.
- Las respuestas usan UTC y deben normalizarse a la zona horaria del workspace.

## 3. Stories: viabilidad todavía condicionada

La documentación lista métricas asociadas a Stories, como `replies` y `navigation`, dentro de los insights de medios. Sin embargo, todavía hay que demostrar con una cuenta real:

- Cómo se enumeran las Stories activas.
- Si el flujo funciona igual para Business y Creator.
- Qué métricas exactas devuelve cada tipo de Story.
- Durante cuánto tiempo están disponibles el objeto, la media y sus insights.
- Si una Story expirada continúa siendo consultable por ID.
- Si la URL de media expira y cuánto tiempo tiene Zenovi para copiar el archivo autorizado.
- Cómo agrupar varias Stories en una secuencia sin inventar relaciones.
- Si Meta expone respuestas como métrica agregada sin conceder acceso a DMs.

Hasta completar estas pruebas, Stories permanece como **MVP condicionado**. El producto no debe prometer archivo histórico anterior a la conexión.

## 4. Reels y análisis multimodal: preguntas críticas

Para que Zenovi pueda transcribir y analizar un Reel no basta con recibir métricas. El spike debe demostrar:

- Enumeración paginada de medios propios.
- Identificación confiable de Reels mediante tipo y producto de media.
- Obtención autorizada del video o de una URL descargable desde el servidor.
- Duración real de esa URL y estrategia de captura.
- Disponibilidad de caption, timestamp, thumbnail, permalink y campos relacionados.
- Disponibilidad de views, reach, shares, saves, total/average watch time y skip rate por cuenta y versión.
- Diferencia entre contenido orgánico, impulsado y crossposted.
- Posibilidad legal y técnica de conservar una copia para el análisis solicitado por el propietario.

Si Zenovi no puede obtener el archivo del Reel por una ruta autorizada, el usuario necesitará subirlo manualmente. Ese fallback debe probarse, pero no sustituye la validación del flujo ideal.

## 5. Matriz ejecutable de capacidades

Las rutas se fijarán a una versión explícita de Graph API. Son plantillas de prueba, no contratos internos de Zenovi; los campos y métricas se registrarán por versión y tipo de medio.

| Capacidad | Llamada de prueba | Permiso provisional | Acceso externo | Retención/precaución | Estado |
|---|---|---|---|---|---|
| Resolver cuenta profesional | `GET /{ig_user_id}?fields=id,username,account_type,media_count` | `instagram_business_basic` | Advanced Access | Guardar ID externo cifrado/lógico y datos mínimos | Validado con Creator propia en v23.0 |
| Enumerar medios propios | `GET /{ig_user_id}/media?fields=id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp` | `instagram_business_basic` | Advanced Access | Paginación por cursor; las URLs no son almacenamiento permanente | Reel, imagen y carrusel validados con Creator propia |
| Leer detalle de medio | `GET /{ig_media_id}?fields=...` | `instagram_business_basic` | Advanced Access | No asumir que todos los campos aplican a todos los formatos | Reel, imagen y carrusel validados; ausencia de caption/thumbnail comprobada |
| Insights de cuenta | `GET /{ig_user_id}/insights?metric=...&period=...` | `instagram_business_manage_insights` | Advanced Access | Varias métricas requieren `metric_type=total_value`; vacío no equivale a cero | Valores reales validados con un seguidor; histórico de followers/follows vacío bajo 100 |
| Insights de Reel | `GET /{ig_media_id}/insights?metric=...` | `instagram_business_manage_insights` | Advanced Access | Persistir valor, ventana, versión y timestamp de sincronización | Core validado; share enviado aún en 0; follows/profile incompatibles específicamente con Reel en Instagram Login v23.0 |
| Enumerar Stories activas | `GET /{ig_user_id}/stories?fields=...` | Basic + Insights | Advanced Access | Sin prometer histórico previo a la conexión | Imagen y video validados con Creator; Business pendiente |
| Insights de Story | `GET /{ig_media_id}/insights?metric=...` | `instagram_business_manage_insights` | Advanced Access | Capturar mientras está activa y reconsultar tras expirar | Imagen/video validados; respuesta visible en cuenta (`replies=1`) pero no atribuida por la Story (`replies=0`) |
| Descargar media para análisis | `media_url`/campo autorizado obtenido del objeto | `instagram_business_basic` | Advanced Access | Descarga server-side; medir expiración y política de borrado | Story JPEG/MP4, Reel MP4 completo con duración, imagen de feed y seis slides JPEG validados; expiración pendiente |
| Conteo agregado de comentarios | Campo/insight del medio | Basic/Insights según respuesta real | Advanced Access | Es interacción, no lead identificado | Comentario real validado: `comments_count=1`, `comments=1` y total interactions consistente, sin permiso de moderación |
| Leer o moderar comentarios | Edge de comentarios/webhook | `instagram_business_manage_comments` | Advanced Access | Consentimiento progresivo y política específica | Opcional; fuera de primera conexión |
| Meta Ads | Facebook Login + Marketing API | Permisos de Ads separados | Revisión adicional | Integración y consentimiento independientes | Fuera del MVP |
| DMs | Conversations/Send API | `instagram_business_manage_messages` | Advanced Access | Datos sensibles; minimización y retención separadas | Fuera del MVP |
| Publicar contenido | Contenedores + publicación | `instagram_business_content_publish` | Advanced Access | Acceso de escritura y revisión separados | Fuera del MVP |

### Campos observados por formato en v23.0

| Campo | Reel | Imagen de feed | Carrusel |
|---|---:|---:|---:|
| `media_type` / `media_product_type` | Sí | Sí | Sí |
| `permalink` / `shortcode` | Sí | Sí | Sí |
| `timestamp` / `username` | Sí | Sí | Sí |
| `media_url` | Sí | Sí | Sí |
| `thumbnail_url` | Sí | No | No |
| `caption` | Omitido en pieza sin caption | Omitido en pieza sin caption | Omitido en pieza sin caption |
| `like_count` / `comments_count` | Sí | Sí | Sí |
| `is_comment_enabled` | Sí | Sí | Sí |
| Hijos individuales | No aplica | No aplica | Seis hijos con tipo, URL, permalink y timestamp |

La ausencia de un campo debe persistirse como “no disponible”, no transformarse automáticamente en cadena vacía o cero. En la corrida controlada, el carrusel devolvió un like real y cero comentarios; la imagen y el Reel devolvieron cero en ambos conteos.

### Insights de cuenta observados con un seguidor

Consulta individual con `period=day`, `metric_type=total_value` y una ventana de dos días:

| Métrica | Resultado observado |
|---|---:|
| `views` | 18 |
| `reach` | 1 |
| `profile_views` | 6 |
| `accounts_engaged` | 1 |
| `total_interactions` | 4 |
| `likes` | 2 |
| `comments` | 1 |
| `replies` | 1 |
| `shares` | 0 |
| `saves` | 0 |
| `profile_links_taps` | 0 |
| `follower_count` | Conjunto vacío |
| `follows_and_unfollows` con `follow_type` | Conjunto vacío |

Los totales de cuenta no deben reconstruirse sumando ciegamente métricas de medios: pueden tener otra ventana, semántica o ritmo de procesamiento. En esta corrida, por ejemplo, el Reel informó un guardado mientras `saves` de cuenta permaneció en cero.

### Seguidores: señal global, no atribución de contenido

La API permite observar el conteo actual de seguidores y, cuando Meta lo entrega, las altas y bajas agregadas de la cuenta durante una ventana. Esto solo permite mostrar la evolución global de la audiencia. No permite relacionar el cambio con la última publicación: un follow puede provenir de un Reel reciente, otro de semanas atrás, una Story, el perfil, una recomendación, una colaboración o una fuente externa.

Reglas para el MVP:

- Mostrar `followers_count` y `follows_and_unfollows` únicamente en una sección general de audiencia/cuenta.
- No asociar el crecimiento a ventanas posteriores a una publicación ni usarlo para ordenar, puntuar o comparar Reels.
- No afirmar ni insinuar “seguidores generados por este Reel” sin una señal atribuida por Meta.
- No convertir un conjunto vacío de `follows_and_unfollows` en cero.
- No solicitar permisos de mensajes: conocer si un usuario que escribió sigue a la cuenta no cubre a todos los seguidores ni aporta causalidad.
- Mantener la atribución exacta visible en Insights nativos como una brecha de plataforma; el MVP no incorporará carga manual ni extracción desde capturas para suplirla.

### Compatibilidad de conversión por formato en Instagram Login v23.0

| Formato | `follows` | `profile_visits` | `profile_activity` |
|---|---:|---:|---:|
| Reel (`REELS`) | Error 100 | Error 100 | Error 100 |
| Imagen (`FEED`) | Compatible | Compatible | Compatible |
| Carrusel (`FEED`) | Compatible | Compatible | Compatible |
| Story (`STORY`) | Compatible | Compatible | Compatible |

“Compatible” significa que la API aceptó la métrica y devolvió un valor; no implica que la prueba haya atribuido una conversión real a esa pieza. La diferencia entre los Insights nativos de Instagram y la API pública permanece como riesgo de producto. La matriz con Facebook Login ya descartó que exigir una Página vinculada cierre esa brecha para Reels.

### Comparación del mismo Reel: app nativa vs. Instagram Login v23.0

| Señal | App nativa | API pública probada |
|---|---:|---:|
| Views | 120 | 120 |
| Espectadores / reach | 104 | 104 |
| Likes / comentarios | 1 / 1 | 1 / 1 |
| Guardados / shares | 0 / 0 | 0 / 0 |
| Tiempo promedio | 5 s redondeados | 5,935 s |
| Skip rate | 41,9 % | 41,9 % |
| Visitas al perfil | 3 | Error 100 para Reel |
| Nuevos seguidores | 0 | Error 100 para Reel |
| Reposts | 0 | Error 100 para Reel |
| Curva de retención | Visible | No expuesta por las métricas probadas |
| Fuentes de visualización | Visible | No expuestas por las métricas probadas |
| Seguidor/no seguidor y demografía | Visible por Reel | No expuesta por Reel; breakdown agregado de cuenta vacío |

La paridad del núcleo cuantitativo está demostrada. La comparación de Instagram Login y Facebook Login confirmó que las señales exclusivas de la interfaz nativa no están expuestas para ese Reel mediante las rutas probadas. Un control positivo de follow desde el botón contextual del Reel puede completar la evidencia observacional, pero no cambiaría el rechazo del endpoint: Zenovi no debe prometer atribución exacta por Reel. El crecimiento observado provino de una visita manual al perfil.

### Métricas a solicitar por tipo, no en una lista universal

- Cuenta: empezar por `reach`, `follower_count`, `profile_views`, `accounts_engaged`, `total_interactions`, `follows_and_unfollows`, `profile_links_taps` y `views` cuando correspondan.
- Reel: probar `views`, `reach`, `likes`, `comments`, `shares`, `saved`, `total_interactions`, `ig_reels_video_view_total_time`, `ig_reels_avg_watch_time` y `reels_skip_rate`.
- Story: probar `views`/`reach`, `replies`, `navigation` y cualquier breakdown documentado que Meta devuelva para la versión seleccionada.
- Imagen, video de feed y carrusel: construir su lista desde respuestas reales; no reutilizar ciegamente la lista de Reels.

## 6. Orden obligatorio del spike

### Etapa A — Preparación

1. Crear una Meta App de tipo Business en modo desarrollo.
2. Configurar Instagram API with Instagram Login.
3. Registrar redirect URIs exactas para desarrollo y staging.
4. Crear una cuenta Business de prueba con contenido y Stories recientes.
5. Crear o conseguir una cuenta Creator de prueba con contenido y Stories recientes.
6. Registrar la versión de Graph API utilizada; no depender de `latest` implícito.

### Etapa B — OAuth

1. Iniciar OAuth en desktop y móvil.
2. Validar `state`, callback y errores.
3. Intercambiar y almacenar el token únicamente en servidor.
4. Resolver ID, username y tipo de cuenta.
5. Probar cancelación, permiso denegado, callback repetido y reconexión.

### Etapa C — Datos orgánicos

1. Listar medios con paginación completa.
2. Clasificar Reel, imagen, video, carrusel y Story.
3. Obtener campos y media autorizada.
4. Consultar insights de cuenta.
5. Consultar insights por tipo de medio.
6. Registrar respuestas vacías, permisos faltantes y errores por métrica.

### Etapa D — Stories

1. Publicar una secuencia de prueba identificable.
2. Sincronizarla mientras está activa.
3. Reconsultarla antes y después de expirar.
4. Medir disponibilidad de media, ID e insights.
5. Repetir en Business y Creator.

### Etapa E — Producción y acceso externo

1. Preparar política de privacidad, condiciones y eliminación de datos.
2. Preparar screencast y explicación de uso para App Review.
3. Solicitar Advanced Access para los permisos mínimos.
4. Conectar una cuenta externa que no pertenezca al equipo.
5. Probar desconexión, revocación y eliminación.

## 7. Criterio de aprobación del gate

El gate de Meta se aprueba únicamente cuando:

- Una cuenta Business y una Creator completan OAuth sin intervención técnica.
- Una cuenta externa puede conectarse mediante permisos aprobables.
- Zenovi obtiene el conjunto mínimo acordado de perfil, medios e insights.
- Al menos un Reel puede descargarse o procesarse por un camino autorizado.
- Existe una decisión demostrada para Stories: incluir, degradar o excluir.
- El equipo documenta ventanas, expiración, paginación, rate limits y errores.
- El flujo no depende de scraping ni credenciales del usuario.

## 8. Decisiones provisionales

- Usar Instagram Login como primera ruta del MVP.
- Mantener Facebook Login desacoplado para Ads y capacidades futuras.
- Solicitar solo Basic e Insights inicialmente.
- Mantener DMs, lectura/moderación de comentarios y publicación fuera del consentimiento inicial.
- No confundir el conteo agregado de comentarios con acceso al contenido de los comentarios.
- No convertir comentarios en `leads` sin una definición y una señal verificable posterior.
- No aceptar cuentas personales en el MVP.
- No prometer histórico de Stories anterior a la conexión.
- No mostrar un dato inexistente como cero.
- No marcar este gate como aprobado hasta completar el spike real.

## 9. Fuentes oficiales

- [Meta — Instagram API workspace](https://www.postman.com/meta/instagram/overview)
- [Meta — Instagram API collection](https://www.postman.com/meta/instagram/collection/6yqw8pt/instagram-api)
- [Meta — Insights para Instagram](https://www.postman.com/meta/instagram/folder/23987686-f659d7d1-d74c-44e4-9192-9b1e8694c511)
- [Meta — Instagram API with Instagram Login](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login)
- [Meta — Instagram API with Facebook Login](https://www.postman.com/meta/instagram/folder/23987686-3a75357f-e106-47ef-a8d9-af1aadf85365)
