# Zenovi - Roadmap operativo

Actualizado: 2026-09-07
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
| UX/UI | Shell y navegación responsive implementados | Wireframes de onboarding y flujos principales |
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
- [ ] Completar inventario funcional de Moka.
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
- [ ] Elegir candidatos de razonamiento, rápido, multimodal, transcripción y embeddings.
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
- [ ] Wireframe de dashboard.
- [ ] Wireframe de Reels/detalle.
- [ ] Wireframe de Stories/secuencia.
- [ ] Wireframe de Director e historial.
- [ ] Wireframe de ADN.
- [ ] Wireframe de Baúl Kanban/calendario.
- [ ] Diseñar estados vacíos, carga, error y permisos.
- [ ] Validar wireframes con 3-5 usuarios.
- [ ] Congelar tokens light del MVP.
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
- [ ] Configurar Vercel previews/staging/prod.
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
- [-] Sidebar/header conectado: identidad real conectada al shell; faltan estados reales de integración y créditos.
- [x] Navegación responsive básica.
- [-] Onboarding y preflight de Meta: preflight visual implementado; faltan auth, OAuth real y estados persistidos. Responsable: Joaco/Codex.
- [ ] Ajustes iniciales.

### Sprint 2 - Meta y sincronización

- [-] OAuth state machine: estados canónicos y persistencia preparados; faltan endpoints OAuth y prueba end-to-end.
- [-] Tokens cifrados: almacenamiento exclusivo del servidor y cifrado de aplicación preparados; falta rotación de claves.
- [ ] Cuenta elegible y selección de activo.
- [ ] Sync inicial/incremental.
- [ ] Jobs idempotentes y retries.
- [ ] Dashboard de estado.
- [ ] Desconectar/eliminar.

### Sprint 3 - Reels y análisis

- [ ] Listado y detalle de medios.
- [ ] Métricas oficiales.
- [ ] Transcripción.
- [ ] Frames/escenas.
- [ ] Análisis estructurado.
- [ ] Benchmark propio.
- [ ] Artefactos persistentes.
- [ ] UI de evidencia y recomendaciones.

### Sprint 4 - ADN y Director

- [ ] ADN mínimo.
- [ ] Chats persistentes.
- [ ] Streaming.
- [ ] Model router.
- [ ] RAG y tools autorizadas.
- [ ] Citas internas.
- [ ] Adjuntos temporales.
- [ ] Memoria/resumen.
- [ ] Créditos y rate limits.

### Sprint 5 - Baúl y Stories

- [ ] Ideas y guiones persistentes.
- [ ] Kanban.
- [ ] Calendario.
- [ ] Vínculo insight -> idea.
- [ ] Stories según gate.
- [ ] Feedback y soporte.

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

## Registro de bloqueos

| Fecha | Bloqueo | Responsable | Condición de salida |
|---|---|---|---|
| 2026-08-28 | Capacidad exacta de Meta/Stories desconocida | Desarrollo | Completar spike y matriz |
| 2026-08-31 | Meta for Developers no entrega el SMS de registro | Operativo externo | Mantener el alta en la cuenta personal real de Joaco y reintentar cuando se recupere el envío; mientras tanto continuar matriz de endpoints, App Review y preparación del spike |
| 2026-08-28 | Costos/modelos no elegidos | Desarrollo | Benchmark con dataset |
| 2026-08-28 | ICP aún no entrevistado sistemáticamente | Comercial | 10 entrevistas |

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
