# Zenovi - Product Requirements Document

Versión: 0.1 - Discovery Draft  
Fecha: 2026-08-28  
Propietarios: equipo fundador de Zenovi  
Dominio: `zenovi.app`  
Estado: base viva para validación, diseño, arquitectura y construcción

> Este PRD describe la visión completa del producto. No significa que todas las funciones entren en el MVP. Las capacidades se clasifican como `MVP`, `Después del MVP`, `Futuro` o `Hipótesis`.

## 1. Resumen ejecutivo

Zenovi será un Director de Marketing IA para coaches, infoproductores y creadores que venden conocimiento, servicios o programas mediante contenido. El producto conectará datos reales de Instagram con análisis multimodal, conocimiento del negocio, planificación de contenido y una IA especializada capaz de explicar qué ocurrió, por qué importa y qué debería hacer el creador después.

La apuesta no es ser otro generador de guiones ni otro dashboard social. Zenovi debe unir dos mundos que hoy suelen estar separados:

1. Rendimiento real del contenido: Reels, Stories, métricas y patrones.
2. Ejecución estratégica: ideas, hooks, guiones, calendario, experimentos y decisiones comerciales.

El primer foco será Instagram y un nicho claro: coaches e infoproductores que utilizan contenido y Stories para construir autoridad, nutrir audiencia y vender. La visión futura permite cuentas adicionales, equipos, otras plataformas, Ads, DMs, CRM y atribución comercial, pero ninguna de esas extensiones debe diluir el problema inicial.

## 2. Problema

Zenovi parte de hipótesis sobre el trabajo real del creador; no de la suposición de que una función técnica, por sí sola, demuestra valor. Estas hipótesis deben confirmarse mediante investigación, entrevistas, observación del flujo actual y uso de la beta.

- Buscar ideas, revisar referencias, adaptarlas al nicho y escribir guiones consume tiempo recurrente.
- El creador no siempre sabe qué publicar, qué función debe cumplir cada pieza ni por qué una idea debería funcionar para su audiencia y oferta.
- Los modelos generalistas suelen entregar ideas y guiones genéricos porque no conocen la voz, el posicionamiento, las objeciones, las pruebas, el negocio ni el rendimiento histórico.
- Instagram entrega métricas, pero muchos usuarios no saben traducirlas en diagnóstico, prioridades y una siguiente acción.
- Resulta difícil comprender dónde cae la atención, si falló el hook, el ritmo, la claridad, la actuación frente a cámara, la estructura o el CTA.
- Alcance, educación, autoridad, nutrición y venta suelen mezclarse sin una estrategia explícita.
- Es difícil saber qué contenido produjo interés comercial, conversaciones o leads; la atribución de ventas suele ser parcial y no debe presentarse como causalidad sin evidencia.
- Stories son un canal importante de nutrición y venta, pero desaparecen y pierden contexto rápidamente.
- El flujo se fragmenta entre Instagram, guardados, notas, tableros, hojas de cálculo y chats de IA que no comparten memoria.
- La estrategia depende de intuición, memoria, prueba y error o acceso a un equipo de marketing costoso.
- Falta una guía experta disponible que interprete lo ocurrido, recomiende qué hacer después y ayude a ejecutar.

La transcripción, el análisis visual, la presencia frente a cámara, la estructura, la retención y las métricas no compiten entre sí. Son fuentes complementarias de evidencia para construir un diagnóstico útil.

## 3. Oportunidad y tesis

Si Zenovi conserva el contexto de marca y negocio, sincroniza contenido propio, analiza lenguaje, imagen, presencia y métricas, y reutiliza ese aprendizaje para orientar la siguiente pieza, puede convertirse en el sistema operativo de marketing de contenido del creador.

La ventaja no provendrá de un único modelo de IA. Surgirá de combinar:

- Datos propios autorizados.
- Un sistema de conocimiento de marketing y contenido.
- Memoria y ADN del negocio.
- Pipelines multimodales especializados.
- Artefactos de análisis persistentes y citables.
- Herramientas deterministas para métricas, permisos y acciones.
- Feedback continuo de usuarios reales.

## 4. Visión de producto

Un creador abre Zenovi y puede comprender en pocos minutos:

- Qué contenido funcionó y bajo qué criterio.
- Qué patrones debería repetir o dejar de usar.
- Cómo rindieron sus secuencias de Stories.
- Qué idea conviene producir a continuación.
- Cómo convertir esa idea en un hook, guion, CTA y fecha de publicación.
- Qué evidencia utilizó Zenovi para recomendarlo.

## 5. Objetivos

### Objetivos de negocio

- Validar disposición a pagar por una herramienta premium mensual.
- Conseguir 10 beta testers del ICP con uso real durante tres meses.
- Transformar al menos una parte relevante de esos testers en clientes o casos de estudio.
- Construir una unidad económica medible para IA y procesamiento multimedia.
- Crear una base extensible a planes de mayor precio sin degradar la calidad esencial.

### Objetivos de usuario

- Reducir el tiempo entre análisis, idea y publicación.
- Mejorar la calidad y especificidad de hooks, guiones y CTAs.
- Encontrar patrones propios, no depender solamente de reglas genéricas.
- Conservar el contexto de Stories y contenido publicado.
- Tomar decisiones con evidencia comprensible.

### No objetivos iniciales

- Reemplazar un CRM completo.
- Automatizar DMs desde el primer día.
- Publicar automáticamente en todas las redes.
- Construir una red social o marketplace de creadores.
- Entrenar un modelo fundacional propio.
- Prometer atribución exacta de ventas sin datos que la demuestren.
- Soportar todos los nichos y plataformas en el MVP.

## 6. Hipótesis de usuario objetivo

### Beachhead provisional

El equipo empezará investigando el siguiente segmento, pero no lo considerará ICP validado hasta comparar subsegmentos, frecuencia del dolor, capacidad de pago, compatibilidad técnica y comportamiento real.

Coach, consultor, experto o infoproductor que:

- Vende servicios, programas, mentorías o formación.
- Utiliza Instagram como canal principal o importante.
- Publica Reels y utiliza Stories con intención comercial.
- Tiene una oferta activa y capacidad de pago.
- Produce contenido personalmente o con un equipo pequeño.
- Siente que las métricas existentes no le dicen qué hacer.
- Valora estrategia y acompañamiento más que volumen de generación.

La segmentación debe evaluar, como mínimo, nicho, madurez del negocio, facturación, tamaño de equipo, cadencia de publicación, dependencia de Instagram, peso de Stories en ventas, proceso actual y presupuesto. El ICP final puede ser más estrecho que esta descripción.

### Usuarios secundarios

- Growth partners que gestionan a varios creadores.
- Agencias boutique de contenido.
- Editores, community managers o estrategas invitados.

Estos usuarios secundarios quedan fuera del diseño central del MVP, pero influyen en la arquitectura futura de workspaces y roles.

### Jobs to be done

- Cuando publico contenido, quiero saber qué parte impulsó o frenó el resultado para mejorar la siguiente pieza.
- Cuando necesito publicar, quiero generar ideas y guiones alineados con mi oferta y mi voz.
- Cuando vendo por Stories, quiero entender dónde cae la secuencia y qué CTA genera más respuesta.
- Cuando mi equipo trabaja contenido, quiero saber qué está en idea, producción, revisión o publicado.
- Cuando pregunto a la IA, quiero que utilice mis datos y cite evidencia, no que responda de manera genérica.

## 7. Principios de producto

1. **Evidencia antes que seguridad aparente:** Zenovi diferencia datos oficiales, cálculos, inferencias y estimaciones.
2. **Una recomendación debe terminar en acción:** cada análisis debe sugerir el siguiente paso.
3. **Calidad esencial consistente:** los planes limitan volumen, profundidad y colaboración; no convierten el plan básico en una IA incompetente.
4. **Privacidad progresiva:** cada integración solicita solamente lo necesario para una función disponible.
5. **Instagram primero:** se profundiza una plataforma antes de sumar muchas conexiones superficiales.
6. **IA única hacia afuera, modelos múltiples por dentro:** el usuario habla con un Director, no administra proveedores.
7. **Contexto controlado:** los adjuntos de chat no contaminan automáticamente el conocimiento permanente.
8. **Diseño para creadores, no para analistas:** claridad, lenguaje del rubro y baja fricción.

## 8. Propuesta de valor

> Zenovi convierte tu contenido y tus métricas de Instagram en decisiones, ideas y guiones guiados por un Director de Marketing IA que conoce tu marca, tu oferta y tu audiencia.

### Diferenciación pretendida

- De Moka: profundidad de análisis, Stories, lenguaje especializado y continuidad entre datos y creación.
- De herramientas de tendencias: incorporación selectiva de competidores y señales externas, sin convertirse en un explorador masivo de virales.
- De gestores de contenido: Baúl y calendario conectados con evidencia de rendimiento.
- De chats genéricos: memoria estructurada, herramientas propias, datos actuales y análisis citables.

## 9. Métricas de éxito

### North Star provisional

`Decisiones de contenido aplicadas por workspace por semana`.

Una decisión aplicada puede ser una idea creada desde un hallazgo, un guion generado con contexto, una recomendación marcada como aplicada o una pieza movida a producción desde un análisis.

### Activación

- Registro completado.
- Cuenta de Instagram elegible conectada.
- Primera sincronización terminada.
- ADN mínimo completado.
- Primer análisis visto.
- Primera conversación útil con el Director.
- Primera idea guardada en el Baúl.

### Engagement y valor

- Workspaces activos semanalmente.
- Horas semanales ahorradas en investigación, adaptación y escritura.
- Tiempo hasta la primera idea o el primer guion utilizable.
- Porcentaje de ideas y guiones aceptados con cambios menores.
- Tasa de reescritura de los outputs de IA.
- Análisis consultados por semana.
- Preguntas con contexto interno adjunto.
- Ideas o guiones creados desde un insight.
- Contenido planificado y posteriormente publicado.
- Recomendaciones convertidas en acciones o piezas planificadas.
- Usuarios que pueden explicar por qué una pieza funcionó o falló después del análisis.
- Porcentaje de recomendaciones valoradas como útiles.
- Tiempo desde conexión hasta primer valor.

### Calidad

- Respuestas con citas correctas.
- Alucinaciones o afirmaciones no respaldadas.
- Concordancia de métricas con Instagram Insights.
- Evaluación humana de ideas y guiones.
- Fallos de sincronización y tiempo de recuperación.

### Negocio y costos

- Conversión prueba a pago.
- Retención mensual.
- Ingreso mensual por workspace.
- Costo de IA y multimedia por workspace.
- Margen de contribución por plan.
- Uso y agotamiento de créditos.

## 10. Alcance funcional completo

### 10.1 Acceso, identidad y workspace

**MVP**

- Registro e inicio con Google OAuth.
- Registro/inicio con email y recuperación segura.
- Perfil personal con nombre, email y avatar.
- Un workspace por cuenta durante el MVP.
- Imagen y nombre de marca separados del perfil personal.
- Ajustes de idioma y zona horaria.
- Eliminación y cierre de sesión.

**Futuro**

- Múltiples workspaces o marcas.
- Selector de workspace en el encabezado del sidebar.
- Invitaciones, miembros y roles.
- Transferencia de propiedad.

### 10.2 Onboarding

**MVP**

Flujo progresivo que evita una entrevista interminable:

1. Crear cuenta.
2. Nombrar el workspace y elegir logo/retrato.
3. Explicar requisitos de Instagram antes de OAuth.
4. Conectar una cuenta profesional.
5. Completar ADN mínimo: nicho, oferta, cliente, objetivo y tono.
6. Mostrar progreso de sincronización.
7. Entregar primer hallazgo y primera acción.

El usuario puede explorar la app con estados de demostración antes de conectar, pero los módulos dependientes de datos deben indicar claramente qué falta.

### 10.3 Integración Instagram/Meta

**MVP**

- Una cuenta profesional de Instagram por workspace.
- OAuth oficial y tokens únicamente en servidor.
- Selección explícita del activo elegible.
- Estado de conexión por etapas.
- Sincronización inicial e incremental de perfil, medios e insights disponibles.
- Reconexión, revocación y eliminación de datos derivados.
- Mensajes de error accionables.

**Después del MVP**

- Meta Ads como conexión opcional y separada.
- Más de una cuenta de Instagram según plan.
- DMs como integración sensible, opt-in y separada.

La matriz exacta de endpoints, permisos, retención y ventanas históricas es un gate técnico previo a la construcción completa.

### 10.4 Inicio y analíticas

**MVP**

- Estado de conexión y última sincronización.
- Rango temporal.
- Evolución de alcance, reproducciones, engagement y crecimiento cuando Meta los provea.
- Comparación contra periodo anterior.
- Top contenidos y contenidos bajo benchmark propio.
- Resumen del Director: señal principal, riesgo y siguiente acción.
- Fuente y definición de cada métrica.

La navegación podrá segmentar por plataforma en el futuro. En el MVP, Instagram es la única pestaña activa.

### 10.5 Reels y publicaciones

**MVP**

- Listado con thumbnail, fecha, duración, caption y métricas clave.
- Ordenar y filtrar por fecha, rendimiento y tipo.
- Detalle de Reel con reproductor o media autorizada.
- Transcripción con timestamps.
- Métricas oficiales disponibles.
- Benchmark contra el propio historial.
- Análisis estándar persistente.
- Preguntar al Director sobre ese Reel sin reprocesarlo.

Análisis estándar esperado:

- Hook verbal y visual.
- Promesa y claridad.
- Estructura narrativa.
- Ritmo y densidad.
- Texto en pantalla y edición observable.
- Presencia frente a cámara con lenguaje prudente.
- CTA y objetivo aparente.
- Fortalezas, fricciones y mejoras priorizadas.
- Evidencia y nivel de confianza.

**Fuera del MVP**

- Análisis profundo.
- Curva de retención inventada o estimada sin evidencia.
- Publicación automática.

### 10.6 Stories

**MVP condicionado por spike de Meta**

- Captura de Stories nuevas después de conectar.
- Agrupación temporal en secuencias.
- Media y metadatos disponibles durante la ventana permitida.
- Métricas soportadas: alcance/views y navegación cuando estén disponibles; replies agregadas a nivel de cuenta, sin atribuirlas a una Story concreta hasta confirmar granularidad consistente.
- Caída entre piezas de una secuencia.
- Clasificación orientativa: nutrición, autoridad, conversación, prueba, objeción, CTA o venta.
- Análisis visual/textual y recomendación.

Zenovi no promete recuperar Stories anteriores desde el archivo privado si la API no las entrega. Debe conservar solo los datos permitidos, con retención y política explícitas.

### 10.7 Director de Marketing IA

**MVP**

- Pantalla principal de chats.
- Historial persistente.
- Crear, reabrir, renombrar, archivar y eliminar conversaciones.
- Chat temporal.
- Streaming de respuestas.
- Adjuntar imagen o documento permitido con alcance del chat.
- Agregar contexto interno: Reel, Story, idea, competidor o periodo.
- Citas hacia objetos internos y métricas.
- Generación de ideas, hooks, guiones, CTAs y planes.
- Ayuda contextual de producto.
- Créditos visibles y bloqueo claro al agotarse.

**Planes superiores/futuro**

- Carpetas/proyectos con instrucciones y conocimiento compartido.
- Mayor almacenamiento y memoria.
- Análisis profundo.
- Acciones automatizadas con aprobación.

### 10.8 ADN de marca y negocio

**MVP**

- Nombre, logo/retrato y descripción.
- Nicho y posicionamiento.
- Oferta, servicios/productos, precios y modalidades.
- Cliente ideal, dolores, deseos y objeciones.
- Diferenciadores, mecanismo y promesas permitidas.
- Tono, palabras propias y palabras evitadas.
- Casos de éxito, autoridad y prueba.
- Objetivos, CTAs y canales de conversión.
- Edición manual y confirmación de hechos.

La carga de conocimiento debe ser guiada. Los documentos permanentes serán explícitos y limitados; no se aceptará cualquier archivo sin propósito.

### 10.9 Baúl de contenido y calendario

**MVP**

- Ideas y guiones como objetos persistentes.
- Vista Kanban: idea, priorizada, en producción, revisión, programada, publicada y archivada.
- Vista calendario.
- Fecha objetivo, formato, objetivo, CTA y notas.
- Crear idea desde el Director o desde un hallazgo.
- Vincular una pieza publicada cuando sea posible.
- Historial básico de cambios.

**Futuro**

- Aprobaciones, comentarios y asignaciones.
- Publicación o programación directa.
- Briefs para editores.

### 10.10 Competidores

**MVP reducido o beta extendida**

- Añadir una cuenta pública mediante URL o username.
- Guardar perfil y contenido público permitido.
- Comparar temas, hooks, formatos y frecuencia.
- Evitar presentar como oficiales métricas no disponibles.
- Límite bajo de competidores.

**Futuro**

- Alertas, descubrimiento automático, librería viral y benchmarks por nicho.

La viabilidad legal y técnica del acceso a contenido público debe validarse antes de prometerlo.

### 10.11 Audiencia, ventas y atribución

**Después del MVP / Hipótesis**

- Perfil agregado de audiencia según datos permitidos.
- Registro manual de conversaciones, leads, llamadas y ventas.
- Integraciones con CRM, calendarios o Manychat.
- Pipeline `contenido -> conversación -> lead -> llamada -> venta`.
- Correlaciones, no causalidad falsa.

DMs y datos comerciales sensibles no forman parte del MVP.

### 10.12 Planes, facturación y créditos

Se prevén tres planes, todavía sin precio definitivo.

Dimensiones de diferenciación:

- Créditos mensuales de IA.
- Cantidad de análisis y reprocesamientos.
- Cuentas conectadas.
- Competidores.
- Almacenamiento permanente.
- Proyectos de IA.
- Miembros/roles.
- Frecuencia de sincronización.
- Integraciones avanzadas.

**MVP beta**

- Plan interno de prueba con saldo controlado.
- Medición real de costos.
- Sin cobro automático si la beta es gratuita.
- Preparación del modelo de entitlements para no reescribir permisos más adelante.

### 10.13 Ajustes, soporte y administración

**MVP**

- Perfil, workspace, branding y preferencias.
- Estado de integraciones.
- Consumo de créditos.
- Exportación/eliminación básica de datos solicitada.
- Canal de feedback y soporte.
- Panel interno para workspaces, conexiones, jobs, costos y errores sin exponer secretos.

## 11. Flujos principales

### Activación

`Registro -> workspace -> explicación de requisitos -> OAuth -> validación -> sincronización -> ADN mínimo -> primer insight -> primera idea`

### De Reel a próxima pieza

`Reel sincronizado -> análisis estándar -> patrón detectado -> preguntar al Director -> crear idea/guion -> Baúl -> calendario -> publicado -> comparar resultado`

### Secuencia de Stories

`Webhook/polling -> captura permitida -> agrupación -> métricas -> caída/CTA -> recomendación -> nueva secuencia en Baúl`

### Conversación con contexto

`Nuevo chat -> agregar Reel/idea/periodo -> recuperar artefactos autorizados -> responder con cita -> guardar decisión opcional`

## 12. Arquitectura de IA

### Una experiencia, múltiples rutas

El Director utilizará un router interno según tarea, costo, modalidad y calidad:

- Modelo avanzado para estrategia, crítica y guiones finales.
- Modelo rápido para clasificación, ayuda, extracción y resúmenes.
- Modelo multimodal para imágenes y frames.
- Servicio de transcripción para audio y timestamps.
- Embeddings para recuperación semántica.
- Código determinista para métricas, filtros, permisos y cálculos.

No se selecciona un proveedor definitivo hasta ejecutar un benchmark propio con contenido real en español.

### RAG y contexto

El contexto se separa por fuente:

- Conocimiento general de marketing versionado.
- ADN y hechos aprobados del workspace.
- Oferta y avatar.
- Contenido y transcripciones propias.
- Análisis persistentes.
- Competidores.
- Memoria aprobada.
- Adjuntos limitados al chat.

Los datos estructurados se consultan desde Postgres mediante herramientas; no se convierten indiscriminadamente en texto vectorial.

### Memoria

- Mensajes recientes.
- Resumen acumulativo.
- Decisiones o preferencias confirmadas.
- Contexto recuperado por permisos y relevancia.
- Límite de contexto por operación.

### Seguridad de herramientas

- Esquemas estrictos.
- Autorización en servidor.
- Tools de lectura y escritura separadas.
- Confirmación humana para acciones sensibles.
- Límite de pasos, tiempo y costo.
- Ningún secreto en prompts.

## 13. Arquitectura técnica recomendada

Estado: recomendación inicial; debe aprobarse mediante spike y presupuesto.

### Aplicación

- Next.js App Router + TypeScript.
- React Server Components por defecto y Client Components solo donde exista interacción.
- Deploy en Vercel con entornos preview, staging y production.
- Dominio principal `zenovi.app`; subdominios provisionales `app.zenovi.app` y `api.zenovi.app` solo si la arquitectura lo requiere.

### Datos, auth y storage

- Supabase Auth para email y Google OAuth.
- Postgres como fuente de verdad.
- Row Level Security en toda tabla expuesta.
- Supabase Storage con buckets privados para media, adjuntos y branding.
- `pgvector` para embeddings cuando el benchmark lo justifique.
- Migraciones versionadas y tipos generados.

### Backend y jobs

- Route Handlers/Server Actions para operaciones cortas y autenticadas.
- Workers o workflows durables para sincronización, transcripción, extracción de frames, embeddings y análisis.
- Cola con semántica at-least-once e idempotency keys.
- Vercel Queues/Workflow puede evaluarse, pero al estar Queues en beta se mantiene una alternativa portable.
- Cron para sincronización y mantenimiento; webhooks cuando Meta los soporte.

### IA

- Vercel AI SDK como capa de streaming, outputs estructurados y tools.
- Capa propia `ModelRouter` para evitar dependencia del proveedor.
- Vercel AI Gateway o adaptadores directos según costos, privacidad y observabilidad.
- Proveedores separados para razonamiento, multimodal, transcripción y embeddings si el benchmark lo requiere.
- Registro interno de modelo, proveedor, tokens, latencia, caché y costo.

### Multimedia

- Descarga temporal únicamente desde fuentes autorizadas.
- FFmpeg en worker compatible para audio, escenas, thumbnails y frames.
- Storage privado con URLs firmadas.
- Artefactos versionados y deduplicados por media/pipeline.
- Límites de tamaño, duración, concurrencia y retención.

### Observabilidad

- Logs estructurados con correlation ID, workspace y job sin PII innecesaria.
- Error tracking y trazas de frontend/backend.
- Métricas de sincronización, colas, tokens, latencia y costos.
- Alertas por fallos de OAuth, webhooks, consumo y RLS.
- Panel operativo interno y runbooks.

### Email, pagos y analítica

- Proveedor transaccional de email por seleccionar.
- Stripe previsto para planes pagos después de validar precios.
- Analítica de producto con consentimiento y eventos propios; proveedor por seleccionar.
- Google Analytics/Search Console corresponden principalmente al sitio público, no sustituyen la analítica interna del producto.

### CI/CD y calidad

- Repositorio Git con ramas/PRs.
- Typecheck, lint, unit, integration y build obligatorios.
- Tests E2E de flujos críticos.
- Migraciones y RLS verificadas en CI.
- Preview deployments sin datos reales de producción.
- Feature flags para integraciones y pipelines costosos.

## 14. Modelo de datos de alto nivel

Entidades previstas:

- `users`, `profiles`, `identities`.
- `workspaces`, `memberships`, `roles`.
- `brand_profiles`, `offers`, `audience_profiles`, `brand_assets`.
- `social_connections`, `oauth_attempts`, `social_accounts`, `sync_cursors`.
- `media_items`, `media_metrics`, `story_sequences`, `story_items`.
- `transcripts`, `media_artifacts`, `analysis_runs`, `analysis_findings`.
- `ai_chats`, `ai_messages`, `chat_attachments`, `chat_context_refs`.
- `knowledge_documents`, `knowledge_chunks`, `memories`.
- `content_items`, `content_versions`, `calendar_entries`.
- `competitors`, `competitor_media`.
- `credit_ledger`, `usage_events`, `entitlements`, `subscriptions`.
- `jobs`, `integration_events`, `audit_logs`, `feedback`.

Toda entidad de cliente debe incluir `workspace_id` cuando corresponda. Los blobs y vectores siguen la misma separación.

## 15. Créditos y economía

El usuario ve créditos de IA; Zenovi registra costos reales.

Cada operación debe:

1. Estimar o reservar créditos.
2. Aplicar límites de plan y rate limiting.
3. Registrar modelo, tokens y recursos.
4. Confirmar consumo real.
5. Reconciliar fallos y evitar doble cargo.

No se fijan precios hasta medir al menos:

- Conversación simple y estratégica.
- Generación de guion.
- Transcripción por minuto.
- Frames por minuto.
- Análisis estándar por Reel y Story.
- Embeddings y almacenamiento.
- Sincronización por cuenta.

## 16. Seguridad y privacidad

Requisitos no negociables:

- Mínimo privilegio y autorización progresiva.
- RLS y aislamiento multi-tenant.
- Tokens OAuth cifrados y server-only.
- Protección CSRF/state/nonce en OAuth.
- Verificación de webhooks y replay protection.
- Rate limits por IP, usuario, workspace y operación.
- Presupuestos máximos y circuit breakers.
- Protección de prompt injection directa, indirecta y multimodal.
- Archivos tratados como no confiables.
- Secretos fuera del prompt, RAG, cliente y logs.
- Exportación, desconexión y eliminación verificable.
- Políticas de privacidad, términos, cookies y tratamiento de datos antes de beta externa.
- No utilizar datos del cliente para entrenamiento sin consentimiento explícito.

## 17. Requisitos no funcionales

### Performance

- Interacción principal perceptiblemente rápida.
- Streaming inicial del chat con feedback inmediato.
- Jobs pesados asíncronos y con progreso.
- Listados paginados y consultas indexadas.
- Medios servidos mediante URLs firmadas/CDN conforme a permisos.

### Confiabilidad

- Callbacks y jobs idempotentes.
- Reintentos con backoff y dead-letter/revisión manual.
- Sincronización reanudable desde cursor.
- Estado parcial visible; no ocultar datos viejos como actuales.
- Backups y restauración probados.

### Accesibilidad

- WCAG 2.2 AA como objetivo.
- Navegación por teclado, focus visible y labels.
- Contraste suficiente en light/dark.
- Gráficos con equivalentes textuales.
- `prefers-reduced-motion`.

### Responsive

- Desktop es el contexto principal de trabajo.
- Mobile debe permitir consultar métricas, chats, Reels y estados básicos.
- Edición compleja de Kanban y ADN puede priorizar desktop en MVP.

### Localización

- Español inicial.
- Arquitectura preparada para inglés.
- Zona horaria del workspace para calendario y métricas.

## 18. Analítica de producto

Eventos mínimos:

- `signup_started/completed`.
- `workspace_created`.
- `instagram_oauth_started/authorized/failed`.
- `instagram_account_resolved`.
- `initial_sync_started/completed/failed`.
- `brand_dna_started/completed/updated`.
- `analysis_opened`, `analysis_reused`, `analysis_requested`.
- `ai_chat_created`, `ai_response_completed/failed`.
- `internal_context_attached`.
- `idea_created_from_insight`.
- `content_stage_changed`.
- `credits_warning/exhausted`.
- `recommendation_helpful/not_helpful`.

No se enviará contenido sensible completo a herramientas de analítica general.

## 19. Operación interna

El equipo necesita un panel protegido para:

- Buscar workspace por ID/email con acceso auditado.
- Ver estado de conexión y sincronización.
- Reintentar jobs idempotentes.
- Revocar una integración comprometida.
- Consultar consumo y costo por operación.
- Ajustar créditos de beta con motivo registrado.
- Ver feedback, errores y versión de pipelines.
- Desactivar proveedores o funciones mediante feature flags.

## 20. Experiencia visual

- Instrument Sans Variable.
- Light-first para el MVP.
- Shell continuo entre sidebar y header inspirado en Glovi.
- Sidebar con jerarquía similar a LeadsRover, adaptada a Zenovi.
- Marca/workspace arriba; perfil personal abajo.
- Sistema monocromático: negro, blanco y grises; color únicamente para estados semánticos, enlaces o foco.
- Cards del mismo color que el fondo, diferenciadas mediante bordes grises sutiles al estilo definido en Glovi.
- Dark mode diseñado en tokens, implementación completa posterior si el plazo lo exige.
- Futuro selector multi-workspace sin introducir complejidad de roles en MVP.

Ver `docs/design/design-foundations.md`.

## 21. Estrategia de beta y lanzamiento

### Antes de beta

- Validación de problema con entrevistas.
- Spike de Meta aprobado.
- Políticas y términos publicados.
- App Review/Business Verification según permisos.
- Instrumentación de costos y errores.
- Datos de demo no sensibles.
- Runbook de conexión fallida.

### Beta privada

- 10 creadores seleccionados.
- Acceso gratuito durante tres meses bajo condiciones claras.
- Onboarding asistido.
- Entrevista inicial y sesiones quincenales.
- Canal de feedback dentro del producto.
- Consentimiento para usar testimonios/casos separado del uso del producto.

### Producción paga

- Solo después de validar conexión, valor repetido, costos y soporte.
- Tres planes provisionales basados en uso real.
- Trial más corto o saldo inicial, no necesariamente tres meses para público general.

## 22. Gates de decisión

1. **Problema:** al menos 7/10 prospectos de un mismo subsegmento reconocen un dolor frecuente, costoso y prioritario relacionado con decidir, crear o mejorar contenido.
2. **Workflow:** se cuantifican tiempo actual, herramientas, retrabajo y puntos de bloqueo antes de presentar la solución.
3. **ICP:** se identifica un beachhead con frecuencia de uso, capacidad de pago y compatibilidad técnica suficientes.
4. **Meta:** se demuestra acceso legal y estable a las métricas esenciales.
5. **Stories:** se confirma qué puede capturarse y conservarse.
6. **Calidad IA:** ideas y guiones contextuales reducen tiempo y resultan utilizables con edición razonable; los análisis ayudan a explicar y decidir.
7. **Costo:** cada flujo tiene costo p50/p95 y margen proyectado.
8. **Activación:** usuarios externos llegan al primer valor sin intervención técnica.
9. **Retención:** la beta demuestra uso repetido y decisiones aplicadas.

## 23. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambios o revisión de Meta | Bloqueo del núcleo | Spike temprano, permisos mínimos, arquitectura desacoplada |
| Stories con ventana limitada | Pérdida de datos | Captura temprana, jobs confiables, comunicación clara |
| Costos multimodales altos | Margen negativo | Muestreo de frames, artefactos reutilizables, créditos, benchmarks |
| Respuestas genéricas | Bajo valor | ADN guiado, RAG separado, evaluación humana y citas |
| Prompt injection/exfiltración | Riesgo de seguridad | Tools autorizadas, secretos fuera del modelo, filtros y pruebas |
| Scope excesivo | MVP tardío | Gates, Must/Should/Could y congelamiento semanal |
| Datos comerciales incompletos | Atribución falsa | Etiquetar correlaciones, entrada manual y no prometer causalidad |
| Un fundador construye demasiado | Cuello de botella | Diseño previo, componentes, automatización y reparto comercial claro |

## 24. Definición de terminado por función

Una función no está terminada únicamente porque la pantalla existe. Debe incluir:

- Criterios de aceptación.
- Autorización y RLS.
- Loading, empty, error y retry.
- Eventos de analítica.
- Logs y observabilidad.
- Límites y consumo.
- Accesibilidad básica.
- Responsive acordado.
- Pruebas unitarias/integración/E2E proporcionales.
- Documentación y soporte.
- Política de datos y eliminación cuando corresponda.

## 25. Preguntas abiertas

- ¿Qué subsegmento sufre con mayor frecuencia y urgencia los problemas de ideación, guionado, análisis y decisión?
- ¿Qué trabajo concreto pagaría primero: ahorrar tiempo, mejorar la calidad, interpretar resultados, recibir dirección o conectar el ciclo completo?
- ¿Cuántas horas y cuánto dinero cuesta hoy ese trabajo?
- ¿Qué nivel de edición convierte una idea o un guion en “utilizable” para cada subsegmento?
- ¿Qué métricas exactas ofrece Meta para cada tipo de cuenta y contenido?
- ¿Qué profundidad histórica se puede sincronizar de forma confiable?
- ¿Qué debe incluir el análisis estándar para ser claramente superior?
- ¿Competidores entra en MVP o en beta extendida?
- ¿Qué archivos permanentes necesita realmente el ADN?
- ¿Qué estados justifican color y cuáles deben permanecer monocromáticos?
- ¿Qué combinación de modelos gana el benchmark en español?
- ¿Cuánto puede costar cada plan manteniendo margen y valor premium?
- ¿Qué roles necesitan los growth partners y cuándo justifican múltiples workspaces?

## 26. Documentos relacionados

- `docs/MVP-SPEC.md`
- `docs/ROADMAP.md`
- `docs/design/design-foundations.md`
- `docs/research/icp-avatar-research.md`
- `docs/research/meta-feasibility.md`
- `docs/research/meta-spike-runbook.md`
- `docs/research/moka-trial-findings.md`

## 27. Referencias técnicas consultadas

- Meta Instagram API: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Next.js App Router: https://nextjs.org/docs/app
- Next.js production checklist: https://nextjs.org/docs/app/guides/production-checklist
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase AI & Vectors: https://supabase.com/docs/guides/ai
- Vercel AI Gateway: https://vercel.com/docs/ai-gateway
- Vercel Queues: https://vercel.com/docs/queues
- Vercel AI SDK: https://ai-sdk.dev/docs/ai-sdk-core

## 28. Historial de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-08-28 | Primera consolidación de visión, producto completo, infraestructura, seguridad y gates |
