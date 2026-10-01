# Zenovi - Roadmap operativo

Actualizado: 2026-09-29
Estado general: Discovery  
Objetivo inmediato: decidir viabilidad y congelar el scope del MVP

> Este archivo es el tablero maestro de ejecución. Se actualiza cada semana. Una tarea se marca `[x]` únicamente cuando cumple su definición de terminado; no cuando solamente fue iniciada.

## Cómo usar este roadmap

- `[ ]` pendiente.
- `[-]` en progreso; usar solo en una sección de trabajo activo y añadir responsable.
- `[x]` terminado y verificado.
- `[!]` bloqueado; escribir causa y siguiente condición.
- `[?]` decisión pendiente.

Cada reunión semanal debe actualizar:

1. Qué terminó.
2. Qué está en progreso.
3. Qué está bloqueado.
4. Qué decisión vence esta semana.
5. Qué se elimina o mueve de alcance.

## Estado ejecutivo

| Área | Estado | Próximo resultado |
|---|---|---|
| Problema/mercado | En análisis | Entrevistas y mapa competitivo |
| ICP | Hipótesis | Perfil priorizado y criterios beta |
| Moka/competencia | Evidencia parcial | Prueba funcional con cuenta elegible |
| Meta | En progreso — Standard Creator validado | Probar Stories, Business, OAuth propio y acceso externo |
| IA | Arquitectura conceptual | Benchmark real de modelos |
| UX/UI | Shell refinado; Inicio, Analíticas y biblioteca de Contenido implementados | Validar estados y detalle de Contenido con usuarios |
| Infraestructura | Recomendación inicial | ADR de stack y ambientes |
| Seguridad/legal | Baseline definido | Políticas y threat model del MVP |
| Beta | Concepto | Lista de 20 prospectos para conseguir 10 |

## Fase 0 - Fundamentos ya definidos

- [x] Reiniciar Zenovi como proyecto nuevo.
- [x] Guardar documentación persistente en Markdown.
- [x] Definir coaches/infoproductores como ICP inicial provisional.
- [x] Definir Instagram como primera plataforma.
- [x] Posicionar Zenovi como Director de Marketing IA.
- [x] Separar DMs del MVP.
- [x] Definir historial de AI Chats separado de DMs.
- [x] Definir créditos de IA como unidad visible provisional.
- [x] Definir adjuntos temporales y conocimiento permanente separado.
- [x] Dejar análisis profundo fuera del MVP.
- [x] Definir proyectos de IA como capacidad de plan superior.
- [x] Definir Instrument Sans Variable.
- [x] Definir dirección visual light-first y monocromática.
- [x] Crear PRD v0.1.
- [x] Crear especificación MVP v0.1.
- [x] Crear roadmap v0.1.

## Fase 1 - Viabilidad de mercado

Objetivo: confirmar que existe un problema urgente, un comprador claro y una propuesta diferenciada.

### Mercado y competencia

- [ ] Construir mapa de categorías: analytics, content OS, AI strategist, trend discovery, social listening y attribution.
- [ ] Auditar Moka con una cuenta profesional elegible.
- [-] Completar inventario funcional de Moka: la vista de un Reel está inventariada sección por sección en `research/moka-trial-findings.md` (2026-09-27), con lo que Zenovi ya tiene, lo que le falta y las siete secciones de su análisis de IA. Faltan las vistas de Competencia, Tu audiencia, Ventas y Mesa de trabajo.
- [x] Confirmar en el Loom el flujo de competencia de Moka: `@`, rastreo periódico, Trial Reels, transcripción y análisis IA.
- [ ] Determinar la fuente/proveedor de datos públicos que utiliza Moka para competencia.
- [ ] Evaluar términos, riesgo legal, estabilidad y costo de recopilar contenido público de competidores.
- [ ] Comparar Business Discovery oficial frente a proveedor externo, carga por URL y seguimiento propio.
- [ ] Confirmar si Moka permite carga manual de Reels; el Loom solo confirma carga manual de ventas.
- [ ] Separar dato oficial, cálculo, IA y estimación en Moka.
- [ ] Auditar Virlo, Shortimize y Mochi con la misma matriz.
- [ ] Encontrar 10 competidores adicionales en español e inglés.
- [ ] Registrar precios, ICP, promesa, onboarding, integraciones y límites.
- [ ] Identificar huecos que Zenovi puede defender.
- [ ] Redactar conclusión de competencia y riesgos de comoditización.

### Entrevistas ICP

- [x] Crear documento central de investigación de ICP/avatar con segmentación, problemas, resultados, objeciones, lenguaje, criterios beta e hipótesis trazables.
- [ ] Definir guion de entrevista sin vender la solución.
- [ ] Seleccionar 15-20 coaches/infoproductores.
- [ ] Realizar al menos 10 entrevistas.
- [ ] Identificar flujo actual de contenido y herramientas.
- [ ] Cuantificar horas dedicadas a buscar ideas, adaptar referencias y escribir guiones.
- [ ] Medir tasa de reescritura y utilidad percibida de los guiones creados con IA generalista.
- [ ] Investigar cómo deciden si una pieza será de alcance, educación, autoridad, nutrición o venta.
- [ ] Investigar cómo interpretan retención, caídas, hooks, presencia, CTA y resultados.
- [ ] Investigar cómo relacionan contenido con conversaciones, leads y ventas sin inducir respuestas.
- [ ] Cuantificar costo, frustración y consecuencias de no resolver estos problemas.
- [ ] Investigar uso real de Stories para venta.
- [ ] Investigar qué pagarían y por qué resultado.
- [ ] Identificar objeciones de privacidad al conectar Instagram.
- [ ] Comparar subsegmentos por dolor, frecuencia, capacidad de pago y compatibilidad técnica.
- [ ] Puntuar candidatos para beta.
- [ ] Actualizar ICP y propuesta de valor.

### Gate de fase

- [ ] Al menos 7/10 de un mismo subsegmento reconocen un problema común, frecuente y prioritario.
- [ ] Existe evidencia cuantificada del tiempo o retrabajo que consume el flujo actual.
- [ ] Al menos 5 aceptan probar una solución conectada a datos reales.
- [ ] Existen señales de disposición a pagar un precio premium.
- [ ] El equipo puede explicar en una frase por qué Zenovi no es “otro ChatGPT para contenido”.

## Fase 2 - Spike técnico de Meta

Objetivo: eliminar el mayor riesgo antes de construir interfaces dependientes.

- [x] Crear Meta App de desarrollo con la cuenta personal real de Joaco y 2FA activado.
- [x] Completar investigación documental inicial de Meta.
- [x] Crear runbook ejecutable del spike de Meta con cuentas, casos, evidencias y criterio de aprobación.
- [x] Definir Instagram Login como ruta primaria provisional del MVP.
- [x] Mantener Facebook Login desacoplado para Ads y capacidades futuras.
- [x] Confirmar documentalmente soporte para cuentas profesionales Business y Creator.
- [x] Confirmar que Instagram Login no requiere Página de Facebook para el núcleo orgánico.
- [x] Confirmar permisos mínimos provisionales: Basic e Insights.
- [x] Confirmar Advanced Access como requisito para cuentas externas.
- [x] Aclarar que Advanced Access permite que usuarios externos autoricen por OAuth; no entrega contraseñas ni exige administrar su negocio.
- [x] Separar conteo agregado de comentarios de lectura/moderación de comentarios individuales.
- [?] Decidir si `instagram_business_manage_comments` entra como permiso progresivo posterior; fuera de la primera conexión provisional.
- [-] Crear matriz `capacidad -> endpoint -> permiso -> revisión -> retención -> límite`; perfil, paginación, Reel, descarga autorizada, imagen, seis slides de carrusel, Stories de imagen/video, insights principales y `x-app-usage` ejecutados en v23.0; faltan Business, expiración y umbrales de límite. Responsable: Joaco.
- [ ] Preparar cuenta Business de prueba.
- [x] Preparar cuenta Creator de prueba con Reel, post, carrusel y secuencia controlada de Stories.
- [ ] Verificar requisitos de página/portfolio.
- [x] Confirmar y probar los permisos mínimos del núcleo: `instagram_business_basic` e `instagram_business_manage_insights`, sin mensajes, comentarios ni publicación.
- [-] Verificar App Review y Business Verification; paquete mínimo por permiso documentado, requisitos exactos del panel pendientes de verificar al crear la app.
- [x] Ejecutar una prueba Standard con una Creator propia añadida como evaluadora: autorización, token, perfil, Reel, imagen, carrusel e insights verificados.
- [x] Verificar la matriz de campos de Reel, imagen y carrusel en v23.0, incluida la omisión real de campos no aplicables y el acceso individual a los seis slides.
- [x] Descargar temporalmente un Reel autorizado, extraer su duración y comprobar que puede derivarse retención media a partir del watch time sin conservar el archivo de prueba.
- [x] Validar conteos agregados de likes y comentarios reales sin solicitar permiso para leer o moderar comentarios individuales.
- [x] Investigar brecha entre Insights nativos y API por Reel: matriz Instagram/Facebook Login en v23/v26 completada. Ambas rutas rechazan visitas, actividad del perfil, follows y `follow_type` para Reels; Facebook Login añade `reposts`, pero no curva, fuentes ni demografía por pieza. El follow realizado desde el perfil no fue atribuido al Reel.
- [x] Delimitar la señal de seguidores: `followers_count` y `follows_and_unfollows` solo sirven para evolución global de la cuenta y no deben asociarse por ventana, ranking o inferencia a Reels concretos. No hay un webhook oficial documentado de nuevos seguidores que cierre la brecha; se descarta suplirla con carga manual o capturas en el MVP.
- [x] Mantener `instagram_business_content_publish` fuera del consentimiento inicial: habilita publicación en nombre del usuario, no amplía Insights, y publicación automática está fuera del MVP.
- [-] Preparar solicitud de Advanced Access para conectar beta testers externos sin roles en la app; narrativa y evidencias mínimas definidas, screencast y envío pendientes.
- [ ] Probar OAuth end-to-end en desktop y móvil.
- [ ] Probar callback, refresh, cancelación y retry.
- [x] Resolver manualmente una cuenta Creator elegible y confirmar tipo, username y conteos básicos; falta implementar los mensajes en Zenovi.
- [ ] Medir profundidad histórica de medios y métricas.
- [-] Verificar Reels, Stories y webhooks disponibles. Reels, watch time, skip rate y Stories de imagen/video con métricas y media validados; expiración y webhooks pendientes.
- [ ] Medir expiración de media/URLs y tokens.
- [ ] Probar desconexión y revocación.
- [ ] Crear prueba automatizada del state machine de conexión.

### Gate de fase

- [ ] Se puede conectar una cuenta externa elegible con permisos aprobables.
- [x] Las métricas mínimas de Reels son suficientes: views, reach, interacciones, watch time, duración derivable y skip rate fueron validados con datos reales.
- [ ] Existe decisión explícita para Stories: incluir, degradar o excluir.
- [ ] La arquitectura no depende de scraping no autorizado.

## Fase 3 - Benchmark de IA y costos

Objetivo: seleccionar pipelines por evidencia, no por preferencia de proveedor.

- [ ] Construir dataset consentido/ficticio de evaluación.
- [ ] Definir rúbrica para análisis, ideas, hooks y guiones.
- [-] Elegir candidatos de razonamiento, rápido, multimodal, transcripción y embeddings.
  Transcripción ya tiene primario: Groq `whisper-large-v3-turbo`. El modelo de análisis
  tiene como candidato multimodal activo a Gemini 3.8 Flash: procesó un Reel real
  directamente y devolvió escenas, OCR, hooks y CTA con timestamps. Falta compararlo
  contra una segunda alternativa antes de elegirlo. GPT-OSS en Groq sigue siendo
  candidato para texto + métricas, pero no resuelve por sí solo los frames; Ollama queda
  como alternativa para ejecutar modelos abiertos y amortiguar tokens cuando exista
  infraestructura propia. No confundir la elección del transcriptor con la del modelo
  que escribe el análisis.
- [ ] Probar al menos dos alternativas por función crítica.
- [ ] Medir calidad en español.
- [ ] Medir latencia p50/p95.
- [ ] Medir tokens, multimedia y costo total.
- [ ] Probar outputs estructurados y consistencia.
- [ ] Probar prompt injection y archivos hostiles.
- [ ] Elegir modelo primario y fallback por tarea.
- [ ] Diseñar tabla provisional de créditos.
- [ ] Fijar presupuesto duro de beta por workspace.

### Gate de fase

- [ ] Análisis estándar supera baseline acordado.
- [ ] Guiones resultan utilizables con edición razonable.
- [ ] Costo proyectado permite margen premium.
- [ ] Existe fallback para proveedor caído.

## Fase 4 - Producto y diseño

Objetivo: eliminar ambigüedad antes de construir.

- [ ] Aprobar PRD v0.1 con los tres socios.
- [ ] Aprobar scope MVP y lista Won't have.
- [x] Definir arquitectura de información final del MVP: ciclo Observar → Decidir → Crear, biblioteca unificada de Contenido y sistema separado.
- [ ] Mapear activación y primer valor.
- [-] Wireframe del shell, onboarding y conexión: arquitectura, sidebar, header, navegación responsive y preflight de Instagram implementados; faltan estados posteriores a OAuth y validación con usuarios.
- [-] Wireframe de dashboard: primer corte funcional con métricas, tendencias y contenido destacado; se perfeccionará al final después de aprender de las demás secciones. Responsable: Joaco/Codex.
- [-] Analíticas por pestañas: Visibilidad, Engagement, Contenido, Comunidad y Audiencia, cada una en su archivo y todas alimentadas por un único modelo de cálculo (`lib/analytics/report-model.ts`). La pestaña y el período viajan en la URL. Se retiró Resumen: cada cifra quedó en la sección que la explica. Visibilidad abre con una card de embudo —visualizaciones y, debajo, alcance, visitas al perfil y toques en el enlace con su variación— y sigue con la evolución diaria de cada paso. Falta decidir si el radar de Comunidad sobrevive con datos reales. Responsable: Joaco/Claude.
- [-] Wireframe de Analíticas: estructura en seis secciones, cada una con la pregunta que responde — Resumen, Calidad del engagement, Visibilidad, Comunidad, Audiencia y Qué funcionó —, tomando de Moka la información que junta y no su forma de graficar. Me gusta, comentarios, guardados, compartidos, visitas al perfil y toques en el enlace se reconstruyen día por día; conversión perfil → seguidor, seguidores nuevos y demografía quedan marcados como sin conectar (Meta exige 100 seguidores). Integradas la Progress Metric Card (21st.dev, reconstruida porque el registro exige login) en Visualizaciones e Interacciones y el radar de Intent UI en días con más interacción, ambos con los tokens de Zenovi. Falta validar cada cifra contra Instagram Insights nativo con una cuenta de actividad real y conectar una cuenta de más de 100 seguidores; el diseño fino de cards queda para después del MVP. Responsable: Joaco/Claude.
- [-] Wireframe de Reels/detalle: biblioteca, benchmark por formato, duración verificada desde el archivo reproducible, transcripción persistente, análisis multimodal y mapa temporal implementados. Gemini sigue como proveedor provisional y falta validar visualmente el flujo completo con cuota disponible, medir calidad/costo y elegir fallback antes de considerarlo cerrado.
- [-] Wireframe de Publicaciones/detalle: reutiliza métricas oficiales ya sincronizadas, distingue imagen, video y carrusel, compara cada pieza con su formato exacto y muestra seguidores, visitas y actividad del perfil atribuidos por Instagram sin inferir ventas. Los slides del carrusel y su navegación ya forman parte del contrato; falta validar la jerarquía visual y la proporción persistida con publicaciones reales después de una sincronización.
- [-] Wireframe de Stories/secuencia: la biblioteca agrupa las Historias por día local en secuencias (12 por página) y el detalle abre con la secuencia de izquierda a derecha, con el cambio de views entre slides como conector, antes del análisis. `/content/story-preview` muestra una secuencia ficticia sólo en desarrollo. El cambio entre slides compara views acumuladas, no sigue a las mismas personas. Debajo de la tira van Completaron (comparado con la mediana de las últimas 10 secuencias propias, con su gráfica), la curva de abandono, Respuestas, Visitas al perfil y Seguidores ganados por cada 100 personas, y la tabla `Por Historia`. El análisis se pide, se abre y se cierra como en Reels. Falta verlo con una secuencia real de la cuenta de prueba.
- [ ] Wireframe de Director e historial.
- [ ] Wireframe de ADN.
- [ ] Wireframe de Baúl Kanban/calendario.
- [-] Diseñar estados vacíos, carga, error y permisos: Inicio, Analíticas, Contenido, Producción y el detalle tienen carga, error y no encontrado; Analíticas distingue cuenta conectada sin métricas, y Analíticas y Contenido distinguen conexión vinculada pero no sana (requiere acción, error, sincronizando, OAuth incompleto) de cuenta nunca conectada. Inicio recibe el mismo tratamiento. Producción se sumó el 2026-09-26: `loading.tsx` con el esqueleto de las cuatro columnas y el mismo alto que el tablero real —para que nada salte al terminar de cargar—, `error.tsx` que aclara que las ideas y los guiones siguen guardados, un estado inicial que cuenta el recorrido completo en vez de mostrar cuatro columnas vacías, y el semáforo distinguiendo "no hay cuenta conectada" de "no hay historial suficiente", que no es lo mismo. Falta validar los textos con usuarios.
- [ ] Validar wireframes con 3-5 usuarios.
- [-] Congelar tokens light del MVP: base implementada; pendiente calibrar el borde de cards contra valores computados de referencias y validar contraste.
- [x] Crear `.interface-design/system.md` después de aprobación.
- [ ] Prototipo navegable de flujo crítico.
- [ ] Revisión de accesibilidad.

### Gate de fase

- [ ] Un usuario comprende el producto y llega a primera acción en prototipo.
- [ ] No hay pantallas sin estado de error/vacío.
- [ ] Cada dato visible tiene procedencia definida.

## Fase 5 - Preparación técnica

Objetivo: base productiva antes de features.

- [x] Inicializar Next.js/TypeScript.
- [ ] Configurar lint, format, typecheck, unit y E2E.
- [ ] Crear Supabase dev/staging/prod.
- [-] Configurar migraciones y tipos: migración inicial de Auth/workspace aplicada manualmente y verificada con 12/12 controles; falta registrar el historial remoto y generar tipos.
- [-] Configurar Vercel previews/staging/prod: producción ya está vinculada a GitHub y despliega `main` automáticamente con sus variables; falta separar y validar el entorno de previews/staging.
- [ ] Configurar dominio y DNS cuando corresponda.
- [ ] Configurar secretos por ambiente.
- [ ] Definir ADRs de stack, jobs, IA y storage.
- [-] Implementar auth y workspace: Google/email, callback y creación persistida del workspace implementados; falta validación end-to-end remota.
- [-] Implementar RLS y tests negativos: políticas iniciales preparadas; falta aplicar, ejecutar tests cruzados y revisar asesores de Supabase.
- [ ] Configurar error tracking, logs y correlation IDs.
- [ ] Configurar feature flags.
- [ ] Crear pipeline CI obligatorio.
- [x] Establecer controles de rendimiento: presupuesto y protocolo local con Lighthouse CLI definidos, sin añadir Lighthouse CI a las dependencias del proyecto.
- [ ] Crear datos demo seguros.

## Fase 6 - Construcción MVP

### Sprint 1 - Shell, acceso y onboarding

- [-] Auth Google/email: flujos implementados con respuestas anti-enumeración; falta validación end-to-end y hardening remoto de Supabase.
- [-] Perfil y branding del workspace: nombre y perfil conectados; falta carga de imagen y edición.
- [-] Sidebar/header conectado: perfil activo de Instagram, avatar personal de Google, colapsado, acciones globales y navegación real implementados; faltan estados completos de integración, notificaciones y consumo real.
- [x] Navegación responsive básica.
- [-] Onboarding y preflight de Meta: conexión real completada con cuenta Creator y estados persistidos; faltan pulir el flujo, probar cancelación/reintento/móvil y completar mensajes accionables. Responsable: Joaco/Codex.
- [ ] Ajustes iniciales.

### Sprint 2 - Meta y sincronización

- [-] OAuth state machine: endpoints, callback, persistencia y conexión real implementados; faltan pruebas automatizadas, cancelación, móvil y cuenta externa.
- [x] Renovar el token de Instagram antes de que venza: cada sincronización lo renueva cuando faltan 20 días o menos (Meta exige 24 h de antigüedad y da 60 días más). Probado contra Meta el 2026-09-15: token nuevo de 60 días guardado cifrado y verificado leyendo insights.
- [-] Tokens cifrados: almacenamiento exclusivo del servidor y cifrado de aplicación preparados; falta rotación de claves.
- [-] Cuenta elegible y selección de activo: resolución automática de una Creator real verificada; falta flujo explícito cuando existan varios activos elegibles.
- [-] Sync inicial/incremental: perfil, medios, métricas por pieza y totales comparables implementados. La serie diaria abarca 90 días —el techo de retención de Meta— pedida en tramos de 30 para que un tramo caído no invalide los demás. `views` y `total_interactions` se reconstruyen día por día con ventanas de un día, porque Meta no entrega su histórico; se verificó contra la serie real de `reach` que una ventana de un día devuelve el valor de ese día. Falta paginación completa de medios, expiración y validar la corrida prolongada.
- [-] Jobs idempotentes y retries: upserts, sync manual y cron diario autenticado implementados; faltan retry/backoff durable, observabilidad y pruebas de fallo.
- [-] Dashboard de estado: Inicio y Analíticas consumen datos reales y distinguen faltantes de cero, incluida la serie diaria, que deja los días sin informar en `null` y los dibuja como hueco en vez de como caída. En Analíticas, visualizaciones e interacciones totalizan el período elegido (7, 30 o 90 días) y se comparan contra el período anterior sólo si la base lo guarda completo; el período termina en el último día cerrado para absorber la demora de hasta 48 h de Meta. El alcance conserva el total oficial de 7 días porque no se puede sumar por día. Faltan definiciones accesibles por métrica y decidir cómo obtener el alcance de 30 y 90 días.
- [ ] Cambiar de cuenta de Instagram sin mezclar datos: hoy el callback hace upsert de `social_accounts` por `connection_id`, así que conectar otra cuenta en el mismo workspace conserva el mismo id y su historia (medios e insights diarios) queda mezclada con la de la cuenta anterior. Mientras no se resuelva, cada cuenta de prueba se conecta desde un usuario de Zenovi distinto.
- [-] Validar cada cifra de Analíticas contra el panel profesional de Instagram: `npm run report:analytics [-- usuario]` imprime los totales de 7 y 30 días con las mismas funciones de la página. Comparado con el panel de @elcostarrica (16 ago – 14 sep): coinciden visualizaciones (167), visitas al perfil (7), toques en el enlace (0) y cambio de seguidores (0). Interacciones da 6 contra 7: la API devuelve 6 con días UTC y con días del Pacífico, y por tipo informa Reels 2 donde la app muestra 3 (posible repost, no confirmado). Contenido publicado da 4 contra 6 porque la API de contenido no devuelve historias. Se sumaron alcance del período, visualizaciones de seguidores y no seguidores, y visualizaciones por tipo de contenido (carrusel dentro de publicaciones); en 30 días coinciden exacto con la app: 105, 27,5 % y Reels 124 · Publicaciones 35 · Historias 8. Falta repetirlo con una cuenta de actividad real.
- [x] Desconectar/eliminar: Ajustes permite desconectar Instagram y borrar todos sus datos con confirmación en dos pasos, y el callback de Meta (`/api/integrations/instagram/data-deletion`) borra la cuenta cuando alguien quita Zenovi desde Instagram. En los dos casos se borra la conexión y cae en cascada sobre cuenta, contenido, métricas y tokens. El callback verifica el `signed_request` con HMAC-SHA256 y el secreto de la app de Instagram (Zenovi-IG, distinta de la app de Meta), responde `url` y `confirmation_code`, y registra cada pedido en Vercel sin datos personales. Probado en producción el 17 de septiembre con @elcostarrica, las dos vías: la de Ajustes y la de Instagram, esta última borró la cuenta en segundos sin dejar datos huérfanos. La primera prueba desde Instagram falló y los registros mostraron la causa: Instagram asigna dos ids a cada cuenta —`id`, el de la app, y `user_id`, el de la cuenta profesional— y Meta avisa con el segundo, que no se guardaba. Se agregó `social_accounts.professional_account_id`, que se completa al conectar y en cada sincronización.
- [x] Detectar un acceso revocado durante la sincronización: Meta responde a un token inválido, vencido o revocado con `OAuthException` código 190 (comprobado contra la API: 401 con código 190). Antes ese error se perdía como `meta_http_401` y la sincronización lo trataba como falla pasajera, así que la cuenta quedaba trabada sin ofrecer volver a autorizar. Ahora se reconoce como `authorization_revoked`, la conexión pasa a `action_required` —que hace aparecer el aviso para reconectar— y la sincronización manual lleva a la pantalla de conexión con un mensaje que explica qué pasó.
- [-] Política de privacidad y términos: publicadas en `/privacy` y `/terms`, públicas y enlazadas desde el login y el registro. Cubren lo que exigen las Condiciones de la Plataforma de Meta —qué datos, para qué, con quién y cómo borrarlos—, describen desde ya el análisis con IA para no tener que repetir la revisión al sumarlo, y registran los pagos con Polar como revendedor. Responsables: Joaquín Piñeyro, Samuel Romero y Juan Marcos Pimienta como personas físicas; ley uruguaya 18.331; email provisional. Falta la revisión de los tres socios, idealmente con asesoramiento legal, y reemplazar el email provisional.
- [-] Pasar la app de Meta a producción: la solicitud de revisión quedó armada y guardada —permisos `instagram_business_basic` e `instagram_business_manage_insights`, descripciones en inglés, video de 3:45 con el flujo completo, usuario de prueba `Prueba` con su marca, tratamiento de datos y instrucciones para revisores—. Falta sólo la verificación del negocio, anotada en el registro de bloqueos.
- [ ] Pasar la app de Meta a producción para que cualquier cuenta pueda conectarse sin agregarla como probadora: requiere revisión de Meta de `instagram_business_basic` e `instagram_business_manage_insights`, política de privacidad y términos publicados, URL de borrado de datos cargada, ícono, y un video mostrando el uso de cada permiso. La política y los términos necesitan texto legal definido por los socios.

### Sprint 3 - Reels y análisis

- [x] Duración persistente: cuando Meta entrega el archivo, el navegador lee sus metadatos
  una sola vez y guarda una duración validada. Biblioteca, detalle y retención reutilizan
  ese valor sin depender nuevamente de la URL temporal; el contrato completo queda en
  `docs/research/reel-data-contract.md`.

- [x] Listado y detalle de medios: la sincronización pagina por cursor y trae al menos las últimas 100 piezas, más las de los últimos 90 días si hay más, con tope de 300; las estadísticas por pieza se actualizan para lo reciente y se completan una vez para lo viejo. La biblioteca muestra las últimas 100 en páginas de 24 y el detalle permite pedir y volver a abrir su análisis persistido.
- [-] Métricas oficiales: ingestión y visualización inicial implementadas; por contenido se solicitan views, reach, likes, comments, shares, saved y total interactions, más tiempo medio, tiempo total y skip rate para Reels. Cuenta solicita cada total por separado y muestra views, reach, total interactions, profile views, accounts engaged y link taps sin convertir ausentes en cero. Falta verificar nuevamente la sincronización completa contra Instagram Insights nativo.
- [-] Evolución diaria por pieza: `instagram_media_insight_snapshots` guarda una foto diaria de cada acumulado lifetime por Reel, con una fila idempotente por pieza, métrica y fecha. El sync ya la alimenta y el detalle deriva visualizaciones nuevas entre días consecutivos para mostrar el pico y la caída sin repartir cifras cuando falta un día. La historia empieza el 19 de septiembre de 2026 y no puede reconstruir días anteriores; falta acumular al menos dos snapshots consecutivos y comprobar la gráfica con actividad real.
- [ ] Presentar la evolución de seguidores: la foto diaria ya se guarda en `instagram_account_insights` con `metric=follower_count` y `period=day` desde 2026-09-12, pero todavía no se muestra en ninguna pantalla. Formato aún por comprobar —card KPI o gráfica—; la cifra exacta se reserva para esa vista dedicada y el resto de la interfaz usa notación compacta.
- [x] Comprobar que se puede obtener el video de un Reel desde el servidor: `npm run probe:media`. Meta devuelve una `media_url` nueva en cada pedido, con un host de CDN distinto del guardado, y las dos se descargan sin credenciales, con `Range` y respuesta `206`. Un Reel de prueba pesó 6,1 MB. Conclusión para el pipeline: pedir la URL fresca en el momento del análisis en vez de confiar en la guardada, y traer el archivo por partes. Falta medir cuánto dura viva una URL.
- [-] Reel restaurado después de archivarse: comprobado el 2026-09-28 con una pieza real.
  Meta reconoce la pieza y responde `200`, conserva portada y métricas, pero omite
  `media_url` incluso en una consulta fresca. Zenovi muestra la portada y no ofrece un
  análisis condenado a fallar; falta comprobar si Meta vuelve a entregar el archivo con
  el tiempo y definir una carga manual como respaldo si el caso persiste.
- [x] Transcripción: proveedor inicial elegido con una prueba propia en español rioplatense:
  Groq `whisper-large-v3-turbo`. Devolvió 253 palabras en 2,5 s, conservó mejor `CTA` y
  `Loom` que Deepgram Nova-3, entrega timestamps por segmento y ya está integrado al
  trabajo a demanda que guarda el artefacto; evidencia y límites en
  `research/transcription-benchmark.md`.
- [-] Frames/escenas: Gemini 3.8 Flash separó escenas de una muestra real y citó texto
  visible con timestamps usando el video directo, que es el camino activo del MVP. Falta
  comparar costo/calidad contra frames seleccionados y repetir sobre más piezas.
- [x] Análisis orientado a decisiones: el trabajo a demanda cruza video, transcripción
  canónica y métricas reales, pero no le devuelve al creador un resumen de lo que ya dijo.
  La versión `reel-v5-reel-map` entrega diagnóstico de rendimiento, fortalezas,
  fricciones e hipótesis de atención, seguido por un plan obligatorio de `Conservá`,
  `Cambiá` y `Probá`. Cada acción enseña un principio transferible a futuros videos e
  indica tramo de origen, motivo, ejecución y métrica a observar. La ejecución revisa voz,
  ritmo, postura, imagen, edición y sonido sólo cuando cambian una decisión; reversionar la
  pieza es una salida secundaria y opcional. Los timestamps quedan como evidencia
  reproducible. Los contratos anteriores continúan leyéndose para no romper resultados
  guardados y ofrecen actualización a la versión nueva.
- [x] Benchmark propio de transcripción: Deepgram Nova-3 contra Groq
  `whisper-large-v3-turbo` sobre un Reel real de 1:30. Groq queda como elección inicial;
  el comparador detecta y rechaza muestras casi sin diálogo.
- [-] Benchmark propio multimodal: Gemini 3.8 Flash procesó el mismo Reel en 36,7 s y
  devolvió 1.307 tokens de salida estructurada sobre 10.708 totales. Reconoció texto,
  herramientas y seis escenas con evidencia temporal. Falta una segunda alternativa,
  más muestras y medición repetida; detalle en `research/multimodal-benchmark.md`.
- [x] Artefactos persistentes: `content_analyses` guarda estado, versión y resultado; los
  videos se descargan en memoria y no se conservan. Falta aplicar el ajuste final de
  grants antes del despliegue.
- [x] UI de evidencia y recomendaciones con estados no pedido, procesando, listo y fallo.

### Sprint 4 - ADN y Director

- [-] ADN mínimo: sección `/brand` con mapa radial ("cerebro") como hero centrado y editor del nodo activo debajo (identidad, voz, diferenciación, objetivo, ofertas y cliente ideal), respaldada por `brand_profiles`, `offers` y `audience_profiles` con RLS de workspace. El guardado es un reemplazo completo de ofertas y audiencia en cada envío. Falta conectar el Director para que consuma este contexto y validar los textos con usuarios. Responsable: Joaco/Claude.
- [ ] Definir la separación estructural entre el ADN de marca y la capacitación del Director: el ADN es data por cuenta (cambia por usuario, se guarda en las tablas de arriba) mientras que el system prompt del Director es la "capacitación" de cómo crear contenido, común a todos los workspaces y versionado por el equipo. No mezclar: un dato del ADN nunca se vuelca al system prompt global, y una regla de capacitación nunca se guarda por cuenta. Falta documentar dónde vive cada uno y cómo se combinan en el prompt final (ver decisión 2026-09-21).
- [ ] Chats persistentes.
- [ ] Streaming.
- [ ] Model router.
- [ ] RAG y tools autorizadas.
- [ ] Citas internas.
- [ ] Adjuntos temporales.
- [ ] Memoria/resumen.
- [ ] Créditos y rate limits.

### Sprint 5 - Producción y Stories

- [x] **Objeto de contenido único** (`content_items`) con `estado` (pipeline: idea → listo para grabar → editando → listo para publicar → publicado), `título`, `tipo de contenido` (corte, transaccional, etc.), `fecha objetivo`, `link de referencia`, `formato`, y `guion` como campo estructurado (hook/desarrollo/CTA). Validado contra el sistema de Moka: la idea es la card en estado "idea"; el guion se llena al avanzar. No hay dos listas separadas.
- [x] Kanban: pipeline por `estado`, arrastrando la card a la siguiente etapa. Es la vista principal. Cada columna mantiene una zona de drop del alto de cuatro o cinco tarjetas y hace scroll por dentro a partir de ahí: una columna con veinte ideas estiraría la página y dejaría a las otras tres en el aire. "Publicada" muestra sólo lo de los últimos 14 días; lo anterior baja a un historial en lista debajo del tablero, porque una columna que guarda todo lo publicado desde siempre deja de servir a los seis meses. Requiere `content_items.published_at` (migración 20260926120000): `target_date` es el plan y `updated_at` se mueve con cualquier edición, así que ninguna de las dos dice cuándo salió la pieza.
- [x] Calendario: la línea de tiempo real de la cuenta. Cada pieza lleva un punto del color de su estado, con una referencia al pie, y se ubica **por el día en que salió** y no por el que se había planificado: una pieza prevista para el miércoles y publicada el sábado ocurrió el sábado, y ponerla el miércoles sería mostrar el plan como si fuera lo que pasó. Además muestra **las publicaciones reales de Instagram** que nunca pasaron por el tablero, en punteado y con su formato; sin eso el calendario contestaba mal la pregunta más obvia que se le hace —"¿qué subí y cuándo?"—, porque lo que el creador publicó sin anotarlo en Zenovi no existía. Las que ya reclamó una pieza del tablero no se repiten. Se puede **arrastrar una pieza a otro día** para replanificarla —mover de día no cambia el estado, y una pieza publicada no se puede mover porque su lugar es el día en que salió de verdad—, y **tocar un día** carga una pieza nueva ya fechada ahí, en vez de abrir el formulario para después elegir la fecha a mano. Un día con más de tres piezas resume con "+N más" para que la grilla no se deforme. Debajo del calendario vive el semáforo de cadencia: los dos hablan del ritmo en el tiempo. El aviso de publicaciones sin registrar queda en el pipeline, que es donde se actúa sobre ellas. Lo publicado se apaga —texto en gris y sin fondo— porque ya salió y no compite con lo que falta hacer. Los colores son los mismos del pipeline: quien aprende que el verde es "publicada" en el tablero no lo vuelve a aprender acá.
- [ ] Guardar desde el Director IA: "agregá esta idea a producción" crea la card en estado "idea", con el porqué de por qué es ganadora (origen: métricas propias, competidores, concepto propio).
- [ ] **Llevar una pieza al Director** (2026-09-27, idea de Joaco): el camino inverso, y el que más se va a usar. Desde una pieza del tablero —una idea suelta o un guion ya escrito— un botón la abre en el Director con su contexto cargado, para desarrollarla ahí. Es distinto de marcar de dónde salió la pieza: esto es una acción, no una procedencia. **Bloqueado**: la ruta `/director` no existe todavía —la barra lateral la enlaza y no hay página— así que cualquier botón hacia allá lleva a la nada. El campo `content_items.source` ya distingue `manual` de `director` y nadie lo escribe con `director`, porque nada puede originar una pieza desde la IA todavía.
- [x] Carga manual: alcanza con un título o con un link de referencia; una idea se guarda con lo que haya a mano.
- [-] Vista detallada en **panel derecho** (no modal): título, tipo de contenido, guion por componentes y comparación contra los Reels ya subidos implementados. Faltan las recomendaciones del Director.
- [-] Segmentación libre del creador. Hecho (2026-09-26) sin tabla nueva: el campo "tipo de contenido" que ya existía pasó a ser una etiqueta de verdad. Zenovi **no impone** una lista de pilares ni de categorías —es el vocabulario del creador, lo que él llame "atracción" o "testimonio"— y la app lo aprende de lo que escribe: al cargar o editar una pieza sugiere los tipos que ya usó, y arriba del tablero aparece una fila de filtros con cada tipo y su cantidad. Los tipos se agrupan sin distinguir mayúsculas ni tildes, para que "Atracción" y "atraccion" no se cuenten como dos cosas. El filtro aparece recién con dos tipos en uso —con uno no hay nada que filtrar— y afecta al tablero y al calendario, no al semáforo ni al historial, porque el ritmo de publicación es de la cuenta entera. Mientras el creador no tenga tipos propios se ofrecen siete de arranque —Atracción, Autoridad, Nutrición, Conversión, Transaccional, Testimonio, Objeciones—, visibles como chips debajo del campo y no sólo en el desplegable del navegador, porque una sugerencia que hay que descubrir haciendo click no existe; desaparecen apenas escribe el suyo. Esa lista es **provisional**: `§16` de la investigación pide derivar el vocabulario de cómo hablan los creadores entrevistados, así que se reemplaza cuando haya entrevistas. Falta decidir si una pieza necesita **varias** etiquetas a la vez, que sí pediría una tabla aparte.
- [ ] Vínculo insight -> idea (contexto de origen).
- [ ] Stories según gate.
- [-] Desglose de navegación de Historias (pasaron, volvieron, salieron). Corregido el 2026-10-01: la app pedía `navigation` sin `breakdown=story_navigation_action_type`, así que esos tres números nunca llegaban con datos reales. Ahora se piden en un pedido aparte (Meta no deja mezclar el desglose con otras métricas); con el total en 0 Meta no manda desglose y se muestran como 0. Falta verlo con una Historia que tenga toques.
- [x] La biblioteca cargaba las últimas 100 piezas mezclando formatos: cinco Historias por día empujaban afuera a Reels y Posts (también en Analíticas y Producción) y cortaban las secuencias viejas. Resuelto el 2026-10-01: el feed (100) y las Historias (300, unos dos meses) se cargan en consultas separadas, con las métricas incrustadas en vez de una lista de ids en la URL, que con cientos de piezas excedía su largo. Comprobado contra la base real.
- [x] Topes contra el abuso de Historias (2026-10-01). Instagram permite 100 Historias por día: sin techo, una cuenta podía acumular ~18 GB de videos en 30 días y agotar su límite horario de Meta con el refresco. Ahora se guardan como mucho 150 videos por cuenta en la ventana de 30 días (del orden de 900 MB; pasado el tope, sólo la portada) y el refresco horario lee hasta 40 Historias por cuenta, empezando por las más cercanas a vencer. La biblioteca carga como mucho 300 Historias.
- [ ] Evaluar a futuro pasar la conexión a Facebook Login. Es la única vía para el webhook `story_insights` (métricas finales exactas al vencer la Historia) y para `mentions`, pero exige que cada creador tenga una página de Facebook vinculada y otra revisión de Meta. Decidido el 2026-10-01: por ahora no; mientras tanto, refresco horario de Historias vivas desde Supabase Cron hasta pasar a Vercel Pro, que de todos modos hace falta para uso comercial.
- [-] Capturar las métricas finales de cada Historia. Hecho en código el 2026-10-01: `/api/cron/instagram-stories` refresca cada hora las Historias vivas (métricas y archivo) disparada por Supabase Cron (`20261001130000_instagram_cron_jobs.sql`). La sincronización diaria sigue en `vercel.json`: es la única automática del resto de la app y no se mueve hasta pasar a Vercel Pro. Falta cargar en Vault `zenovi_app_url` y `zenovi_cron_secret`, aplicar la migración y comprobarlo con una Historia real. Meta las entrega sólo durante 24 h (salvo destacadas) y el cron corre una vez por día, así que hoy cada Historia queda medida a una edad cualquiera entre 0 y 24 h: una publicada a las 5 AM se mide con 1 h de vida y queda congelada. Meta recomienda el webhook `story_insights`, pero se comprobó el 2026-10-01 en la documentación oficial que sólo existe con Facebook Login: con Instagram Login, que es lo que usa Zenovi, no está disponible. Queda un refresco horario de las Historias vivas; como Vercel Hobby sólo permite cron diario, la propuesta es dispararlo desde Supabase Cron (`pg_cron` + `pg_net`), que es gratis. Sin esto, lo habitual y la curva de abandono comparan Historias medidas en momentos distintos.
- [-] Guardar el archivo de cada Historia al sincronizar (Storage privado). Hecho en código el 2026-10-01: bucket privado `instagram-story-archive`, columnas `archived_media_path`/`archived_thumbnail_path`, la sincronización copia las Historias nuevas y la biblioteca y el análisis usan la copia con URLs firmadas. Las imágenes se guardan en WebP (en la prueba, 12,5 KB de JPEG pasaron a 3,8 KB) y los videos se borran a los 30 días dejando la portada; la limpieza corre con la sincronización diaria. Migración aplicada y bucket comprobado (subida, URL firmada, acceso directo bloqueado). Falta verificarlo con una Historia real. Vencida la Historia, Meta no entrega el archivo ni una URL nueva, y la URL guardada del CDN caduca a los días: la miniatura se rompe en la biblioteca y el análisis de una secuencia de más de 24 h falla con "Instagram ya no está entregando el archivo".
- [ ] Feedback y soporte.

Fuera del MVP (trabajo en equipo futuro): links de entregables (video crudo/editado), roles de editor/publicador, y colaboración multi-manos.

### Prioridades validadas de Producción (2026-09-22)

Ordenadas por impacto para el creador; no todas entran en el primer corte:

1. **[x] [fundamental]** Cerrar el ciclo idea → publicado → "¿cómo me rindió?" (2026-09-26). **El vínculo no se le cobra al usuario**: al pasar la pieza a "Publicada", Zenovi la ata sola cuando no hay duda. Decide por el **texto** —el título y el hook contra el caption, sin tildes, sin puntuación y sin palabras de relleno—, no por la fecha: nadie mueve la tarjeta el mismo día que sube el video, y el día que se acuerda puede haber subido otra cosa. Ata sólo si la coincidencia es fuerte (60% de las palabras propias, mínimo dos) y ninguna otra candidata se le acerca; ante cualquier duda no ata nada y no molesta, porque un vínculo equivocado muestra un veredicto ajeno que nadie sospecha. El panel entonces da **un dato y una puerta**: el multiplicador contra la mediana de su formato y un botón "Ver los resultados" que lleva al Reel en Contenido, que es dueño de las métricas, la evolución y los filtros. Producción no los repite. Se puede elegir a mano (plegado, no de entrada) y soltar el vínculo. Verificado contra la base real: vincular, guardar y soltar funcionan; una publicación inexistente la rechaza la clave foránea (23503); una de otra cuenta no es visible; y sobre los captions reales de la cuenta el automático acertó 2 de 2 donde había texto, no ató nada donde el caption era sólo emojis, y nunca ató una pieza ajena.
   - **Límite conocido**: el automático depende de que el creador escriba captions. En la cuenta de prueba, 8 de 10 publicaciones no tienen texto, así que ahí nunca va a disparar y queda el selector manual. El camino para resolverlo es la transcripción del Reel (Sprint 4): cruzar el hook escrito contra el hook dicho en cámara no depende del caption.
2. **[-] [fundamental]** El guion como herramienta de grabación, no texto plano. Hecho: pantalla completa con hook, desarrollo y CTA en bloques grandes, y apuntador con **velocidad regulable** —que es lo que lo vuelve usable: leído rápido se atropella y lento se corta el ritmo, y cada persona habla distinto—. La velocidad se muestra en **palabras por minuto**, no en píxeles por segundo, porque es la unidad en la que alguien reconoce su propio ritmo (se calcula con el largo del guion y la distancia real a recorrer, y no se muestra si el guion entra entero en pantalla, donde la velocidad no gobierna nada). Se recuerda entre tomas, el scroll avanza por tiempo y no por cuadros —si no, una pantalla de 120Hz corre el texto al doble que una de 60— y hay "volver al principio". Falta la dirección de cómo decirlo (plano visual, cómo actuar) derivada de los Reels previos, que depende del análisis.
3. **[pospuesto]** Capturar la idea en el momento sin fricción: desde Instagram/móvil, "guardar para Zenovi" con el link cargado (share sheet o pegar URL). Incluye guardar el video crudo como referencia. El video crudo puede vivir debajo del pipeline o en otra vista/pestaña. **Pospuesto (2026-09-26, decisión de Joaco)**: el MVP es desktop. Zenovi se usa sentado, con el guion abierto y las métricas al lado, y ninguna herramienta comparable exige una app para usar el producto. La captura desde el celular se agrega cuando haya tracción, y no obliga a rehacer nada: es una PWA con share target sobre lo que ya existe.
4. **[x] [alta]** Semáforo de cadencia (2026-09-26): **debajo del tablero**, una frase y nada más. Va abajo y no arriba porque al kanban se entra a lo que se entra: el menú de vistas tiene que ser lo primero y nada puede interponerse entre él y el tablero. La frase cruza el **ritmo real** —cuántas piezas del feed publicó por semana en las últimas 8, leído de Instagram y no preguntado ni impuesto como meta— contra **lo que ya salió esta semana** y lo que hay planificado para los próximos 7 días, y cuántas de esas siguen sin guion. Lo ya publicado se lee de Instagram y no del tablero, y descuenta de lo que falta: una pieza cuenta para la cadencia aunque el creador nunca la haya anotado en Zenovi, y medir sólo lo documentado le diría que está en falta cuando en realidad publicó. La tira de siete días que acompañaba se retiró el mismo día: arrancaba en hoy y no en lunes, así que parecía una semana sin serlo, y usaba dos rellenos distintos para "hoy" y "tiene piezas" sin decir en ningún lado cuál era cuál. La pestaña Calendario ya hace eso bien y está a un click. Todo lo que se puede decir con palabras se dice con palabras. Reglas de honestidad: con menos de 4 publicaciones en la ventana no afirma un ritmo, lo dice; las Historias no cuentan, porque se suben de a varias por día y taparían la cadencia de lo que se planifica; y una pieza ya publicada no cuenta como planificada aunque su fecha caiga en la semana, porque haría parecer que falta menos. Verificado contra la cuenta real: 4 publicaciones en 8 semanas → 0,5 por semana, ninguna esta semana con la última hace 15 días, 1 planificada con guion, "vas al día".
5. **[media]** Una vista/sección principal de Producción (no el kanban como protagonista): el kanban es registro de estados, pero el "modo próximo paso" ("hacé esto ahora: terminá este guion a medias") y el semáforo viven arriba, en una entrada principal tipo "Hoy".
6. **[media]** Reutilizar piezas que rindieron: sugerir derivados (Reel ganador → versión Story o carrusel) en vez de empezar de cero.

### Costo del análisis y cuándo se dispara (2026-09-26)

Decidido en conversación, pendiente de medir contra el pipeline real (Fase 3: "Medir
tokens, multimedia y costo total" y "Diseñar tabla provisional de créditos").

- **Dos cosas distintas que se venían mezclando.** Leer métricas —visualizaciones,
  guardados, alcance, likes— no cuesta nada: viene con la sincronización y ya está.
  El análisis profundo del video —transcripción, frames, estructura, recomendaciones— es
  lo único que consume créditos. Sólo lo segundo se cobra.
- **Nunca analizar todo el contenido de golpe.** Una cuenta con 50 Reels no se analiza
  entera al conectar: es gasto nuestro por piezas que la persona no va a mirar —nadie
  abre el análisis de un Reel de hace tres meses— y no le sirve a ella tampoco.
- **[ ] Analizar las últimas 3-5 publicaciones al conectar la cuenta**, como demostración
  de qué hace Zenovi, y el resto a pedido. Decisión de Joaco.
- **Estimación de costo, con los supuestos escritos** (precios Anthropic al 2026-06-24;
  hay que medirlo, no darlo por bueno). Una pieza de 30-60 s: ~10 frames muestreados
  (~1.200 tokens cada uno), transcripción, métricas y consigna ≈ **15k tokens de
  entrada**; el análisis escrito más el razonamiento ≈ **5k de salida**. A eso da
  ≈ **US$0,04 con Haiku 4.5**, ≈ **US$0,08 con Sonnet 5** y ≈ **US$0,20 con Opus 5**,
  más la transcripción, que es de centavos por minuto y va por fuera (Claude no recibe
  audio). Analizar 50 Reels de una serían ≈ US$4 por usuario; las 3-5 del arranque,
  ≈ US$0,25-0,40.
- **[ ] Dos palancas que bajan eso antes de tocar el modelo**: la consigna y la rúbrica
  son idénticas en cada análisis, así que van con `cache_control` (las lecturas de caché
  cuestan ~10%); y los análisis que no son urgentes —los del arranque, sobre todo— pueden
  ir por la Batch API, que es la mitad de precio.
- **Lo que más va a consumir no es esto, es el chat del Director.** El análisis es un
  costo acotado y por pieza; la conversación crece con el historial en cada turno. La
  tabla de créditos tiene que dimensionarse por ahí.
- **[ ] Pendiente de Joaco**: rate limits de Meta y de los proveedores de IA, y dónde se
  cobra. El análisis es barato en comparación con lo que aporta, así que la hipótesis es
  cobrarlo poco.

- [x] **Reconciliar lo publicado con el tablero** (2026-09-26): debajo del pipeline, una línea plegada avisa "publicaste N piezas que no están en el tablero", leído de Instagram. Son dos olvidos distintos con el mismo síntoma —la idea estaba anotada y nadie movió la tarjeta, o la pieza nunca se planificó—, así que hay dos salidas por publicación: **"Es una idea mía"**, que la enlaza con la pieza del tablero que mejor coincide por texto (sólo se ofrecen las no publicadas, sin vínculo y del mismo formato), o **"Registrar"**, que crea la pieza ya publicada y atada. El color vive sólo en el ícono: un bloque entero teñido se lee como una falla, y esto no lo es —son piezas que salieron bien y que al tablero le falta saber—. Al enlazar, la fecha de publicación pasa a ser **la del video** y no la del día que se movió la tarjeta, que puede ser días después. Una publicación sin caption se nombra "Reel del 31 de agosto" en vez de "Sin título", que repetido cuatro veces no se reconoce.

### Cómo consigue Moka lo que la API no da (2026-09-27)

De las capturas del Loom que pasó Joaco, una etiqueta lo resuelve: en el bloque de
retención, la **Duración** del Reel aparece marcada como **"Apify / DB"**. Apify es una
plataforma de scraping. O sea: Moka no saca esos datos de la Graph API, los **raspa**.

Eso contesta la pregunta abierta de los Trial Reels —Moka los filtra en su biblioteca
("Reel / Trial reel / Todos") y la API no los expone— y también de dónde saca la duración
del video, que tampoco viene por la API.

- [ ] **Decidir si Zenovi raspa o no.** Es una decisión de riesgo, no técnica: implica los
  términos de la plataforma, estabilidad —un cambio de HTML rompe el dato— y costo por
  pedido. Hoy Zenovi obtiene la duración leyendo los metadatos del archivo en el navegador,
  la valida y la persiste en `instagram_media.duration_ms`; las visitas siguientes ya no
  dependen de la URL temporal. Una pieza sin `media_url`, como el Reel restaurado después
  de archivarse, sigue sin duración y no se completa con una estimación.
- Otras cosas que Moka muestra y necesitan datos que no tenemos: **orgánico vs pagado**
  (requiere la API de Ads) y **views por día de semana por pieza** (requiere histórico
  diario por pieza; Zenovi lo empezó a guardar el 2026-09-24).

### Qué métricas da Meta por pieza (2026-09-27)

Sondeado contra la API real, formato por formato (`npm run probe:metrics`). Importa porque
decide qué puede contestar Zenovi sobre una pieza y qué no.

- **Publicaciones del feed (imagen y carrusel)** aceptan tres métricas que no
  sincronizábamos y que son las que dicen si la pieza **hizo crecer la marca**, no sólo si
  se vio: `follows` (seguidores ganados desde esa pieza), `profile_visits` y
  `profile_activity`. Ya se agregaron a la sincronización.
- **Los Reels las rechazan**: *"The Media Insights API does not support the follows metric
  for this media product type"*. Para un Reel no hay atribución de crecimiento por pieza, y
  la regla del MVP es no inventarla por cercanía temporal ni por ranking. Es una asimetría
  incómoda —el Reel es el motor de crecimiento de una marca personal— y hay que decirla en
  pantalla en vez de disimularla.
- **No existen** para ninguno de los dos: `link_clicks`, `impressions`, `navigation`,
  `total_views`, `total_likes`, `total_comments`, `facebook_views`, `crossposted_views`,
  `replies`. Estaban en la lista de valores válidos que devuelve el error de la API, pero
  la pieza las rechaza igual.
- Medido sobre @elcostarrica, que es una cuenta chica: las tres nuevas dieron 0 en todas
  las piezas. La API las acepta; falta una cuenta con actividad real para ver si el número
  significa algo.
- [ ] **Decidir cómo se muestra la asimetría** en la vista detallada: hoy hay una card
  "Ventas · Próximamente" que ocupa ese lugar. Para una publicación se puede decir
  "te trajo N seguidores"; para un Reel hay que decir que Meta no lo entrega.

### El objetivo de la pieza: probado y retirado (2026-09-27)

Se implementó y se sacó el mismo día, con la migración
`20260927120000_drop_content_items_objective.sql`. Queda anotado para no volver a
proponerlo sin haber resuelto lo que lo tumbó.

**Qué hacía**: la pieza declaraba para qué se hizo —vistas, interacciones, guardados o
compartidos— y eso decidía contra qué métrica se la juzgaba. Funcionaba: sobre la misma
publicación daba ×0,83 por visualizaciones, ×1,00 por interacciones y "sin base para
comparar" por guardados, porque ninguna pieza de la cuenta tenía guardados.

**Por qué se retira** (decisión de Joaco):

1. **El objetivo real de un creador suele ser seguidores o ventas**, y los cuatro que se
   podían ofrecer eran proxys. Seguidores por pieza sólo existe en el feed, no en Reels;
   ventas necesita un CRM que no está y es carga manual de la persona. Elegir "que la
   guarden" cuando lo que se quería era crecer no ayuda a nadie.
2. **Alarga cargar una idea**, que es lo que más rápido tiene que ser.

**Qué haría falta para retomarlo**: que exista el CRM (para ventas) o que se acepte la
asimetría Reel/publicación de `follows` y se explique en pantalla.

### Trial Reels: se pueden crear, falta saber si se pueden reconocer (2026-09-26)

Un Trial Reel se muestra sólo a quien no te sigue y después "gradúa" al perfil, a mano o
por rendimiento. Importa porque **su audiencia es otra por diseño**: mezclado con los Reels
normales corre la mediana del formato, y el multiplicador que Zenovi le muestra al creador
termina comparando cosas distintas sin que nadie lo note. Moka los muestra, así que por
algún camino se ven.

Sondeado contra la API real con el token de @elcostarrica (`npm run probe:trial`):

- **Crear**: la API lo soporta, con `trial_params.graduation_strategy` (`MANUAL` o
  `SS_PERFORMANCE`) al crear el contenedor de publicación.
- **Leer, por Instagram Login (el camino que usa Zenovi hoy)**: no se puede. `is_trial`,
  `is_trial_reel`, `trial_params`, `trial`, `is_graduated` y `graduation_strategy` los
  rechaza con "Tried accessing nonexisting field". `media_product_type` devuelve `REELS`
  igual que cualquier otro y no existe métrica específica (`non_follower_reach`,
  `trial_views` rechazadas). Lo único adyacente es `is_shared_to_feed`, que dio `true` y
  describe otra cosa. `graph.instagram.com` tampoco soporta introspección: `metadata=1`
  devuelve cero campos, así que ni siquiera se le puede pedir que liste lo que tiene.
- **[!] Leer, por Facebook Login (`graph.facebook.com`): sin probar.** Es una superficie
  más rica, sí soporta introspección, y es la hipótesis de por dónde lo ve Moka. La sonda
  está escrita (`scripts/probe-trial-reels-facebook.mjs`: lista Páginas, encuentra la
  cuenta Business y pide `metadata=1` sobre la cuenta y sobre un Reel, buscando cualquier
  campo o conexión con "trial" en el nombre) pero el `FACEBOOK_USER_ACCESS_TOKEN` guardado
  venció el 3 de septiembre. **Condición para desbloquear**: un token nuevo de Facebook
  sobre una cuenta Business vinculada a una Página. Hasta correrla, "no se pueden ver los
  Trial Reels" es una afirmación sobre nuestro camino, no sobre la plataforma.
- **Urgencia (Joaco, 2026-09-27)**: las marcas personales están usando muchísimo los Trial
  Reels ahora mismo. Si media cuenta son pruebas y Zenovi no las distingue, el benchmark del
  formato queda corrido —un Trial Reel se muestra sólo a no seguidores, así que su alcance y
  sus interacciones no son comparables— y el creador recibe veredictos sobre piezas que
  buscaban otra cosa. Deja de ser una mejora y pasa a ser una fuente de error.
- **El scraping no resuelve esto**: un Trial Reel no aparece en el perfil ni en la pestaña
  de Reels, sólo se le muestra a quien no sigue la cuenta. La única vista donde existen es
  la del propio creador dentro de la app, así que raspar exigiría automatizar sobre su
  sesión, y eso pone en riesgo la cuenta del cliente —no la app—. Descartado salvo decisión
  explícita.
- **Dónde van los Trial Reels cuando se puedan reconocer** (decisión de Joaco, 2026-09-27):
  **en ningún lado donde estén los demás.** Ni en el benchmark del formato, ni en la
  biblioteca mezclados, ni en el panel de Analíticas de la barra lateral. Tienen su propia
  vista de detalle y se evalúan con su propia vara. Los motivos son de cómo se usan, no de
  prolijidad:
  - **Le hablan sólo a no seguidores**, así que su alcance e interacciones no son
    comparables con los de una pieza que ve toda la audiencia.
  - **Duran tres a siete días y después se borran**, si no funcionaron o si pasan al feed.
    Un dato que desaparece no puede sostener una tendencia ni un promedio.
  - **Se sube el mismo video varias veces** con distinto formato, subtítulo o portada. Tres
    filas del mismo contenido inflan cualquier conteo y no representan tres piezas.
  - Conclusión: un Trial Reel es un experimento, y un experimento se lee contra los otros
    experimentos, no contra lo publicado.
- **Por qué importa esa respuesta antes que cualquier otra cosa**: si por algún camino se
  leen, Zenovi los reconoce solo y no hay nada que pedirle al creador. Pedirle que marque
  la pieza a mano es trabajo manual a cambio de nada visible, así que sólo tendría sentido
  si el camino automático no existe.
- La sonda además devolvió **la lista completa de métricas válidas** de media insights,
  útil para revisar qué no estamos sincronizando: `impressions, shares, comments, likes,
  saved, replies, total_interactions, navigation, follows, profile_visits,
  profile_activity, reach, ig_reels_video_view_total_time, ig_reels_avg_watch_time, views,
  thread_replies, reposts, quotes, thread_shares, threads_views, threads_media_clicks,
  reels_skip_rate, threads_reposts, facebook_views, crossposted_views, total_views,
  total_likes, total_comments, link_clicks`.

### Voz del producto

- [ ] La app debe hablar como un **experto en marketing y marcas personales**: usar la jerga del rubro (hook, CTA, ángulo, pilar, autoridad, nutrición, conversión, transaccional, etc.). Es clave para la afinidad con el cliente y no sonar genérico. El vocabulario debe derivarse del lenguaje del avatar (ver `research/icp-avatar-research.md` §16), no imponerse desde la jerga del equipo.
- [ ] **El Director tiene que saber del rubro, no sólo del contenido que ve** (2026-09-26, Joaco): qué tipos de contenido existen y para qué sirve cada uno, qué son los Trial Reels y cuándo conviene usarlos, cómo se piensa una marca personal o un infoproducto. Hoy el campo "tipo de contenido" arranca con una lista fija (`STARTER_CONTENT_TYPES`) justamente porque el Director todavía no existe; cuando exista, debería ser él quien proponga el tipo mirando la pieza, y la lista fija sobra. Pendiente decidir **cómo se le da ese conocimiento** —prompt de sistema, base de conocimiento propia, o material que Joaco arme del mercado— y con qué fuentes, porque de ahí sale buena parte de la afinidad del producto.

### Sprint 6 - Hardening

- [ ] Tests E2E críticos.
- [ ] Auditoría RLS/IDOR.
- [ ] Prompt injection/tool abuse.
- [ ] Performance y accesibilidad.
- [ ] Estados de error y retry.
- [ ] Backups/restauración.
- [ ] Política, términos y eliminación.
- [ ] Panel operativo.
- [ ] Runbooks.

## Fase 7 - Beta privada

### Preparación

- [ ] Crear criterios de entrada.
- [ ] Crear lista de 20 prospectos.
- [ ] Seleccionar 10 testers.
- [ ] Preparar acuerdo y consentimiento.
- [ ] Preparar onboarding asistido.
- [ ] Preparar formulario de feedback inicial.

### Cohorte 1

- [ ] Incorporar 2-3 testers.
- [ ] Observar conexión sin ayudar salvo bloqueo.
- [ ] Medir tiempo a primer valor.
- [ ] Resolver bloqueadores P0/P1.

### Cohorte 2

- [ ] Incorporar el resto progresivamente.
- [ ] Sesiones quincenales.
- [ ] Revisar telemetría semanal.
- [ ] Etiquetar feedback por problema, frecuencia e impacto.
- [ ] Publicar changelog privado.

### Mes 1

- [ ] Validar activación y estabilidad.
- [ ] Corregir onboarding y errores.
- [ ] Medir costo real por usuario.

### Mes 2

- [ ] Validar recurrencia y calidad.
- [ ] Identificar funciones ignoradas.
- [ ] Probar mensajes de valor y pricing.

### Mes 3

- [ ] Evaluar conversión a pago.
- [ ] Preparar casos de estudio con consentimiento.
- [ ] Definir tres planes con datos reales.
- [ ] Decidir go, pivot o stop.

## Fase 8 - Después del MVP

Solo entra si los gates anteriores justifican inversión.

- [ ] Meta Ads opcional.
- [ ] Competidores ampliados.
- [ ] Proyectos/carpetas de IA.
- [ ] Análisis profundo.
- [ ] Dark mode completo.
- [ ] Múltiples workspaces.
- [ ] Roles y colaboración.
- [ ] DMs opt-in.
- [ ] Integraciones CRM/Manychat/calendario.
- [ ] Pipeline comercial y atribución prudente.
- [ ] TikTok/YouTube según demanda.
- [ ] Publicación/programación.
- [ ] Inglés.

## Backlog de investigación

- [ ] Cómo calcula Moka “retención”.
- [ ] Cómo implementa Moka el ADN de marca.
- [ ] Qué hace realmente el módulo Ventas de Moka.
- [ ] Qué datos de Stories conserva y durante cuánto tiempo.
- [ ] Qué funciones de Mochi conectan mejor contenido y negocio.
- [ ] Qué parte de Virlo aporta señales útiles sin desviar el foco.
- [ ] Qué sistema utiliza Shortimize para competidores.
- [ ] Cuál es el willingness-to-pay del ICP en LATAM, España y mercado anglo.
- [x] Medir en DevTools el borde exterior de cards de ElevenLabs: negro al 10 %, clase estándar de 1 px con ancho fraccionario por escala y radio de 20 px. Zenovi adopta negro al 10 % pero conserva 1 px y radio propio de 14 px.
- [x] Sincronizar demografía de seguidores: `follower_demographics` con `breakdown` en singular, `period=lifetime`, `metric_type=total_value` y `timeframe` obligatorio. Comprobado contra una cuenta real de 28.996 seguidores (`npm run probe:demographics`): edad devuelve 7 tramos, género 3 valores (M, F, U) y país y ciudad los 45 del tope de Meta. `engaged_audience_demographics` y `reached_audience_demographics` responden "Not enough users" incluso en esa cuenta. Cada sincronización reemplaza la foto anterior porque el recorte a 45 valores dejaría países fantasma. La pestaña Audiencia ya los muestra; con menos de 100 seguidores Meta no entrega nada y se mantiene el panel pendiente.
- [x] Comparar rendimiento por formato: la pestaña Contenido muestra, para lo publicado en el período, cuántas piezas salieron de cada formato y su mediana de visualizaciones, con la mejor pieza como referencia. Se usa la mediana y no el promedio para que una pieza que explotó no haga parecer que el formato rinde siempre así, y un formato con menos de tres piezas se cuenta pero no afirma una mediana.
- [ ] Auditar la sección Analíticas por preguntas de usuario, no por cantidad de cards: salud de cuenta, evolución, distribución por formato/objetivo, benchmarks propios, mejores/peores piezas y acciones derivadas.
- [x] Corregir las consultas de Insights de cuenta: se comprobó empíricamente que Meta sólo entrega serie diaria de `reach`; `views` y `total_interactions` se reconstruyen pidiendo una ventana por día en lugar de inventarse. Los días sin informar quedan en `null` y nunca se convierten en cero.
- [?] Validar si `Analíticas` es el nombre más claro para el ICP o si conviene `Rendimiento`, `Resultados` u otra etiqueta; no decidir por imitación de Moka.
- [?] Reubicar Analíticas más abajo en la sidebar: Joaco no la pondría tan arriba. Decidirlo junto con la estructura final de la sección; la sidebar no se modifica hasta entonces.
- [x] Definir una fuente secundaria para métricas y textos de apoyo: DM Sans para números y textos de apoyo, Instrument Sans para títulos y navegación. Se comparó en pantalla con un laboratorio de fuentes temporal (Geist, Inter y DM Sans), ya retirado junto con las dos fuentes descartadas.

## Registro de decisiones

| Fecha | Decisión | Estado | Motivo |
|---|---|---|---|
| 2026-08-28 | Instagram primero | Aceptada | Profundidad antes que amplitud |
| 2026-08-28 | Coaches/infoproductores como ICP provisional | A validar | Uso fuerte de contenido y Stories |
| 2026-08-28 | DMs fuera del MVP | Aceptada | Privacidad, permisos y scope |
| 2026-08-28 | Análisis profundo fuera del MVP | Aceptada | Validar primero análisis estándar |
| 2026-08-28 | Proyectos IA para plan superior | Aceptada | Valor y complejidad adicionales |
| 2026-08-28 | Light-first monocromático | Aceptada | Preferencia de marca y reducción de QA |
| 2026-08-28 | Instrument Sans Variable | Aceptada provisional | Dirección tipográfica |
| 2026-08-28 | Un workspace en MVP | Aceptada | Múltiples marcas/roles se difieren |
| 2026-09-10 | Inicio será dashboard informativo; el brief de IA no será el protagonista | Aceptada | Al entrar, el usuario necesita primero estado, métricas, evolución y accesos rápidos |
| 2026-09-10 | Inicio se perfecciona después de las secciones operativas | Aceptada | Contenido, Analíticas y Director revelarán qué resumen es realmente útil |
| 2026-09-10 | `Analíticas` permanece como etiqueta provisional | A validar | Debe responder al modelo mental del ICP, no a la navegación de un competidor |
| 2026-09-11 | Analíticas y Contenido permanecen separados | Aceptada | Analíticas compara rendimiento transversal; Contenido separa y abre Reels, Historias y Publicaciones |
| 2026-09-11 | Contenido no mezcla formatos en una vista “Todo” | Aceptada | Cada formato necesita proporción, metadatos y lectura propios; Reels abre por defecto |
| 2026-09-11 | Sin submenú de formatos en la sidebar durante el MVP | Aceptada | Los filtros/tabs dentro de las vistas evitan duplicación y mantienen la navegación corta |
| 2026-09-11 | Competidores fuera de la navegación inicial | Aceptada provisional | Puede entrar en beta extendida solo después de validar acceso público, legalidad, estabilidad y costo |
| 2026-09-12 | Visualizaciones e interacciones encabezan Analíticas; alcance acompaña | Aceptada | Para una marca personal el alcance no es la estadística principal; comentarios, compartidos, guardados y seguidores son claves |
| 2026-09-12 | El selector de tres métricas sobre una gráfica compartida es provisional | A validar | Cada métrica tendría su propia gráfica; la estructura definitiva se decide después de ver 90 días de datos reales |
| 2026-09-12 | La base propia es la memoria histórica, no la API | Aceptada | Meta conserva insights de cuenta 90 días y ninguna historia de seguidores; lo que no se guarde cada día se pierde de forma irrecuperable |
| 2026-09-12 | Un día sin informar se guarda y se dibuja como ausencia, nunca como cero | Aceptada | Un cero se lee como caída real; la propia API devuelve conjunto vacío en lugar de ceros |
| 2026-09-12 | El filtro de período lee de la base y no dispara sincronización | Aceptada | Cambiar el rango es instantáneo, no gasta cuota de API ni depende de que Meta responda |
| 2026-09-12 | El filtro de período no aparece en la biblioteca de Contenido | Aceptada | Ahí se ven las piezas publicadas y sus estadísticas actuales, no un rango temporal |
| 2026-09-12 | La cifra exacta de seguidores se reserva a su vista dedicada | Aceptada | El resto de la interfaz usa notación compacta al estilo Instagram, que es como las marcas personales leen esos números |
| 2026-09-13 | Los totales de un período terminan en el último día cerrado | Aceptada | Meta puede demorar hasta 48 h; contar el día abierto marcaría todas las cifras como parciales cada mañana |
| 2026-09-13 | El alcance no se totaliza sumando días | Aceptada | Cuenta cuentas únicas: sumar alcances diarios duplica a quien volvió otro día |
| 2026-09-14 | Analíticas se ordena por preguntas: resumen, engagement, visibilidad, comunidad, audiencia, qué funcionó | A validar | Toma de Moka la información, no la forma; engagement va antes que visibilidad por la prioridad de la marca personal |
| 2026-09-14 | Métricas de escalas distintas no comparten eje; sin donas | Aceptada | Un eje compartido aplasta la serie chica; longitudes se comparan mejor que ángulos |
| 2026-09-15 | Días con más interacción se muestra en radar | Aceptada | Decisión de Joaco sobre la recomendación de barras; se revisa si cuesta leerlo con datos reales |
| 2026-09-15 | Para el MVP prima que cada analítica sea correcta sobre la ubicación exacta de cada card | Aceptada | La estructura de Analíticas se considera suficiente; el diseño se itera después de validar las cifras contra Instagram |
| 2026-09-15 | Lucide como única familia de íconos, con trazo fino | Aceptada | Es la que usan las cards de 21st.dev y shadcn; trazo tipo Apple como en Lovable o ElevenLabs |
| 2026-09-16 | Analíticas se navega por pestañas y no en una página larga | Aceptada | Cinco secciones hacia abajo obligaban a scrollear; cada pestaña vive en la URL junto con el período, así sobrevive a cambiar de rango, sincronizar y compartir el enlace |
| 2026-09-16 | Se elimina la sección Resumen | Aceptada | Repetía cifras que ya viven en su sección; cada número quedó en la pestaña que lo explica |
| 2026-09-16 | Todas las gráficas comparten el azul de datos | Aceptada | La dirección la comunica la variación, no la línea; verde y rojo quedan para la variación y naranja y verde para categorías |
| 2026-09-16 | Interacciones muestra el total de Meta y no la suma de sus partes | Aceptada | Es el número que la persona ve en Instagram; Meta cuenta acciones que no desglosa, así que Composición puede sumar menos |
| 2026-09-16 | Las cifras se abrevian a partir de mil (1k, 1,2k) | Aceptada | Debajo de mil van enteras: una cuenta que arranca necesita ver "10", no "0,0k" |
| 2026-09-16 | DM Sans para números y textos de apoyo; Instrument Sans para títulos | Aceptada | Cierra la decisión pendiente de fuente secundaria; se eligió con el laboratorio de fuentes, que ya se retiró junto con Geist e Inter |
| 2026-09-20 | ADN de marca se guarda como reemplazo completo de ofertas y audiencia | Aceptada | Un workspace con un editor único no necesita diffing ni ids persistentes; borrar y reinsertar mantiene el form simple y evita sincronizar un estado intermedio |
| 2026-09-21 | El ADN de marca (data por cuenta) es una capa distinta de la capacitación del Director (system prompt global) | Aceptada | El ADN cambia por usuario y se guarda en tablas con RLS; la capacitación es común a todos los workspaces y se versiona por el equipo. El objetivo de cada pieza pertenece al contenido (Baúl), no a la marca, y queda fuera del ADN por ahora. La zona de ADN es un plus, no el núcleo: no se prioriza por encima del ciclo Reel → idea |
| 2026-09-21 | Baúl y Calendario se unifican en "Producción", bajo Decidir junto a Director | Aceptada | Son dos vistas de un único objeto `content_items` (Kanban por estado, calendario por fecha), no dos features. La clasificación por objetivo/formato es un campo del objeto. "Producción" refleja el lugar donde se crea y planifica; el calendario muestra también lo publicado hacia atrás vía el vínculo con la pieza |
| 2026-09-22 | Ideas y Guiones se separan en pestañas distintas | Revertida | Ver decisión 2026-09-22 (un solo objeto). Moka valida que un único objeto con `estado` funciona mejor: la idea es la card en estado "idea" y el guión es un campo de esa misma card, no un objeto aparte |
| 2026-09-22 | Ideas y Guiones son un solo objeto de contenido con `estado` y guión como campo | Aceptada | Tras ver el sistema de Moka (Loom "Mi sistema de contenido por dentro"): un pipeline con estados (idea → listo para grabar → editando → listo para publicar → publicado) donde el guión (hook/desarrollo/CTA) se llena al avanzar. Evita dos listas y el quilombo de "qué es idea y qué es guion". Los links de entregables (video crudo/editado) quedan fuera del MVP: es trabajo en equipo futuro |
| 2026-09-22 | La segmentación del contenido es libre, del creador; el "tipo de contenido" (corte, transaccional…) es su lenguaje, no el del equipo | Aceptada | El creador ordena por carpetas/etiquetas propias. Los pilares de marketing (atracción, educación, autoridad, nutrición, venta) son sugerencia opcional del Director, no una taxonomía impuesta. Evita forzar jerga que el usuario no reconoce |
| 2026-09-22 | La app habla como experto en marketing y marcas personales | Aceptada | Usar la jerga del rubro (hook, CTA, pilar, nutrición, conversión, transaccional) para afinidad con el cliente. Vocabulario derivado del lenguaje del avatar, no impuesto |
| 2026-09-27 | Groq Whisper se elige sólo para transcripción; el modelo de análisis sigue abierto | Aceptada | Audio → texto y texto/frames/métricas → análisis son trabajos distintos. GPT-OSS es candidato textual; Ollama queda anotado para amortiguar tokens con modelos abiertos cuando Zenovi tenga infraestructura propia, sin volver el MVP dependiente de una computadora local |
| 2026-09-27 | Gemini 3.8 Flash queda como candidato activo para comprensión audiovisual | Provisional | En un Reel real leyó subtítulos y tablas, reconoció herramientas, separó escenas y entregó hooks y CTA con evidencia temporal usando el contrato de producción. No se convierte en proveedor definitivo hasta compararlo contra otra alternativa y repetir el benchmark sobre más piezas |

## Registro de bloqueos

| Fecha | Bloqueo | Responsable | Condición de salida |
|---|---|---|---|
| 2026-08-28 | Capacidad exacta de Meta/Stories desconocida | Desarrollo | Completar spike y matriz |
| 2026-08-31 | Meta for Developers no entrega el SMS de registro | Operativo externo | Mantener el alta en la cuenta personal real de Joaco y reintentar cuando se recupere el envío; mientras tanto continuar matriz de endpoints, App Review y preparación del spike |
| 2026-08-28 | Costos/modelos no elegidos | Desarrollo | Benchmark con dataset |
| 2026-08-28 | ICP aún no entrevistado sistemáticamente | Comercial | 10 entrevistas |
| 2026-09-18 | La revisión de Meta no se puede enviar sin verificar el negocio | Joaco/socios | Meta exige un porfolio empresarial verificado. El porfolio `Zenovi` (2930002774030568) quedó creado y conectado a la app, con tipo "sociedad unipersonal, no registrada aún". Todos los métodos —dominio, email, SMS, WhatsApp, llamada— terminan pidiendo un documento con la razón social: extracto bancario, registro o licencia, documento fiscal o escritura. Joaco no tiene cuenta bancaria. Dos salidas: (a) verificar a nombre del socio que sí tenga cuenta, cambiando el nombre legal del porfolio y subiendo su extracto, costo cero; (b) inscribir la unipersonal en DGI, que da la constancia fiscal pero genera aportes mensuales a BPS desde el alta, a confirmar con un contador. El resto de la solicitud quedó completo y guardado. |

## Ritmo de trabajo de los tres socios

### Reunión semanal de 45 minutos

- 10 min: métricas y evidencia nueva.
- 10 min: tareas terminadas.
- 10 min: bloqueos y decisiones.
- 10 min: prioridades de la semana.
- 5 min: scope que se elimina o difiere.

### Responsabilidades provisionales

- Producto/desarrollo: arquitectura, implementación, calidad, costos y documentación técnica.
- Investigación/comercial: entrevistas, competencia, prospectos y pricing.
- Go-to-market/operación: beta, posicionamiento, contenidos, onboarding y feedback.

Asignar nombres concretos y suplentes antes de ejecutar.

## Plantilla de actualización semanal

### Semana YYYY-MM-DD

**Objetivo:**  
**Terminado:**  
**En progreso:**  
**Bloqueado:**  
**Decisiones tomadas:**  
**Evidencia nueva:**  
**Riesgos:**  
**Próximas tres tareas:**  
**Cambios de scope:**

## Definición de terminado del proyecto beta

- [ ] 10 usuarios externos incorporados.
- [ ] Cero vulnerabilidades críticas conocidas.
- [ ] Conexión y sync observables/reparables.
- [ ] Costos y margen modelados.
- [ ] Evidencia de uso repetido.
- [ ] Al menos tres casos claros de valor.
- [ ] Decisión documentada de continuar, pivotar o detener.
