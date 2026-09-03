# Zenovi - Especificación del MVP

Versión: 0.1 - Scope Draft  
Fecha: 2026-08-28  
Ventana objetivo: 4 a 6 semanas, sujeta a los gates de Meta  
Audiencia: socios, producto, desarrollo y beta testers

## 1. Propósito

El MVP debe demostrar que Zenovi puede conectar una cuenta profesional de Instagram, convertir contenido y métricas reales en análisis útiles, y reutilizar ese conocimiento para que un Director de Marketing IA produzca mejores decisiones, ideas y guiones.

No tiene que demostrar toda la visión final. Tiene que entregar un ciclo completo y confiable:

`Conectar -> entender -> decidir -> crear -> organizar -> aprender`

## 2. Hipótesis que debe validar

Estas hipótesis no dan por confirmado el ICP ni comparan capacidades que se complementan. La transcripción, el análisis visual, la actuación frente a cámara, la estructura, la retención y las métricas forman una sola capa de evidencia. Lo que debe validarse es si Zenovi resuelve problemas suficientemente frecuentes, costosos y urgentes.

### 2.1 Hipótesis de problema y avatar

- Coaches, consultores e infoproductores pierden varias horas por semana buscando ideas, adaptando referencias y escribiendo guiones.
- La dificultad no es únicamente producir más contenido, sino decidir qué publicar, con qué objetivo y por qué debería funcionar para su audiencia y oferta.
- Los chats de IA generalistas suelen devolver ideas y guiones genéricos porque no conocen la voz, el posicionamiento, la oferta, las objeciones, las pruebas ni el rendimiento histórico del creador.
- Los creadores consultan métricas, pero muchos no logran convertirlas en un diagnóstico claro ni en una acción concreta para la siguiente pieza.
- Existe dificultad para interpretar retención, caídas de atención, hooks, ritmo, presencia frente a cámara, CTA y causas probables de éxito o fracaso.
- Muchos creadores no planifican conscientemente el papel de cada contenido: alcance, educación, autoridad, nutrición o conversión.
- La relación entre contenido, conversaciones, leads y ventas es poco visible o se reconstruye de forma manual e imperfecta.
- Stories cumplen un papel relevante en nutrición y venta, pero desaparecen y pierden contexto si no se capturan a tiempo.
- El flujo está fragmentado entre Instagram, contenido guardado, notas, tableros, hojas de cálculo y chats de IA.
- El creador valora tener una guía experta disponible que le diga qué hacer después y le explique el razonamiento.

### 2.2 Hipótesis de solución

- Una IA especializada y alimentada con ADN, oferta, audiencia, voz y rendimiento propio reduce el tiempo hasta obtener una idea o un guion utilizable.
- La combinación de transcripción, imagen, presencia, estructura, retención, métricas e histórico produce diagnósticos accionables y respaldados por evidencia.
- Clasificar cada pieza por función estratégica ayuda a equilibrar alcance, educación, autoridad, nutrición y venta.
- Un Director que transforma hallazgos en recomendaciones, ideas y guiones genera más valor que un dashboard aislado o un generador aislado.
- Conectar el análisis con el Baúl y el calendario permite cerrar el ciclo `analizar -> decidir -> crear -> organizar -> aprender`.
- Citar la evidencia y distinguir datos, inferencias y estimaciones aumenta la confianza del usuario.

### 2.3 Hipótesis de negocio y viabilidad

- El ahorro de tiempo y la mejora de decisiones justifican una suscripción premium para un subsegmento concreto.
- El uso semanal del Director, los análisis y el Baúl genera retención suficiente para sostener una suscripción.
- El acceso permitido por Meta y los costos de IA y multimedia permiten ofrecer el producto con margen saludable.

### 2.4 Señales de validación

- Horas semanales destinadas a investigar ideas, adaptar referencias y escribir guiones antes y después de Zenovi.
- Tiempo hasta la primera idea o el primer guion considerado utilizable.
- Porcentaje de ideas y guiones aceptados con cambios menores y tasa de reescritura.
- Porcentaje de recomendaciones aplicadas o convertidas en contenido planificado.
- Capacidad del usuario para explicar por qué una pieza funcionó o falló después de consultar Zenovi.
- Retorno semanal y repetición del ciclo completo.
- Confianza declarada en los análisis y en las recomendaciones.
- Señales comerciales observables, como respuestas a CTA o leads declarados, sin prometer causalidad ni atribución exacta en el MVP.
- Evolución global de seguidores separada del análisis de piezas. No asociar por tiempo, ranking ni inferencia ese crecimiento a un Reel concreto cuando Meta no entregue atribución por pieza.
- Disposición a pagar una vez experimentado el flujo completo.

## 3. Hipótesis de usuario inicial

El beachhead provisional es un coach, consultor o infoproductor hispanohablante con:

- Cuenta profesional activa de Instagram.
- Publicación habitual de Reels y Stories.
- Oferta actualmente vendible.
- Uso del contenido como canal de autoridad o adquisición.
- Disposición a participar en onboarding y feedback frecuente.

No se admiten cuentas personales incompatibles con la API. El onboarding debe explicarlo antes del OAuth.

Este perfil es una hipótesis de partida. La investigación debe definir qué subsegmento presenta mayor dolor, frecuencia, capacidad de pago y compatibilidad con Instagram; por ejemplo, nivel de madurez, facturación, tamaño de equipo, cadencia de publicación y dependencia comercial del contenido.

## 4. Resultado de éxito del MVP

El MVP se considera funcional cuando un beta tester externo puede, sin intervención técnica:

1. Registrarse.
2. Crear su workspace.
3. Conectar una cuenta elegible de Instagram.
4. Completar el ADN mínimo.
5. Ver contenido y métricas sincronizadas.
6. Abrir un Reel y comprender su análisis.
7. Consultar al Director utilizando ese Reel como contexto.
8. Crear una idea o guion y guardarlo en el Baúl/calendario.
9. Volver posteriormente y encontrar su historial.

## 5. Scope MoSCoW

### Must have

- Autenticación Google y email.
- Un workspace y un usuario propietario.
- Perfil y branding básico del workspace.
- Onboarding guiado.
- Conexión oficial a una cuenta profesional de Instagram.
- Estado de OAuth y sincronización con errores accionables.
- Dashboard básico de Instagram.
- Listado y detalle de Reels/publicaciones.
- Transcripción y análisis estándar multimodal.
- Stories nuevas y secuencias, si el spike confirma acceso viable.
- ADN mínimo de marca y negocio.
- Director IA con historial persistente.
- Adjuntos temporales de chat.
- Contexto interno desde Reel, Story, idea o periodo.
- Ideas/guiones persistentes.
- Baúl Kanban y calendario básico.
- Créditos internos y límites visibles.
- Seguridad multi-tenant, RLS, rate limits y logs.
- Privacidad, términos, desconexión y eliminación.
- Feedback dentro del producto.

### Should have

- Benchmark de cada Reel contra histórico propio.
- Filtros y comparación temporal.
- Renombrar, archivar y eliminar chats.
- Chat temporal.
- Citas a evidencia interna.
- Clasificación de secuencias de Stories.
- Añadir uno o dos competidores por URL, sujeto a viabilidad.
- Estado de procesamiento detallado.
- Vista móvil de consulta.

### Could have

- Búsqueda en chats.
- Fijar chats.
- Exportar un guion o análisis.
- Plantillas simples de contenido.
- Notificaciones internas.
- Dark mode si el cronograma y QA lo permiten.

### Won't have en este MVP

- DMs de Instagram.
- Meta Ads.
- CRM, Manychat o pipeline de ventas.
- Publicación automática.
- Múltiples cuentas o workspaces.
- Roles, invitados o colaboración avanzada.
- Proyectos/carpetas de IA con conocimiento compartido.
- Análisis profundo.
- Fine-tuning.
- TikTok, YouTube o LinkedIn.
- Facturación pública con tres planes definitivos.
- Atribución automática de ingresos.

## 6. Navegación y pantallas

### Shell global

- Sidebar y header conectados.
- Marca/workspace arriba a la izquierda.
- Perfil personal abajo.
- Medidor de créditos accesible sin dominar la navegación.
- Light mode monocromático como tema principal.

### Navegación MVP

1. Inicio.
2. Analíticas.
3. Reels.
4. Stories.
5. Baúl.
6. Director IA.
7. ADN de marca.
8. Integraciones.
9. Ajustes.

Competidores puede entrar como flag de beta extendida.

## 7. Epic A - Autenticación y workspace

### Historias

- Como usuario quiero registrarme con Google para comenzar rápidamente.
- Como usuario quiero registrarme con email si no uso Google.
- Como creador quiero poner un logo o retrato para sentir el workspace propio.

### Criterios de aceptación

- Google devuelve nombre y avatar al perfil personal.
- Email sin avatar muestra iniciales.
- Perfil personal e imagen de marca permanecen separados.
- El usuario puede editar ambos desde el lugar correcto.
- No se vinculan proveedores únicamente por coincidencia insegura de email.
- La sesión puede revocarse y recuperarse.

## 8. Epic B - Onboarding y conexión de Instagram

### Preflight obligatorio

Antes de abrir Meta, Zenovi explica:

- La cuenta debe ser profesional y compatible.
- Qué datos se solicitarán.
- Qué datos no se solicitarán, incluidos DMs.
- Qué sucederá después de conectar.
- Cómo revocar la conexión.

### Estados técnicos y visuales

- `not_connected`.
- `oauth_started`.
- `meta_authorized`.
- `callback_validated`.
- `token_verified`.
- `account_resolved`.
- `initial_sync_queued`.
- `syncing`.
- `connected`.
- `action_required`.
- `failed`.

### Criterios de aceptación

- El callback es idempotente.
- Refrescar o volver atrás no duplica conexiones.
- Un error identifica si falta cuenta elegible, página, control o permiso.
- Los tokens no llegan al cliente ni a logs.
- El usuario puede desconectar y solicitar eliminación.
- La sincronización reanuda desde cursor.

### Gate

No se construyen promesas visuales definitivas hasta completar la matriz técnica de Meta con una cuenta Business y una Creator.

## 9. Epic C - Dashboard y analíticas

### Contenido

- Cuenta conectada, última sincronización y rango.
- Alcance, reproducciones, engagement y crecimiento disponibles.
- Comparación con periodo anterior.
- Top tres piezas y tres oportunidades.
- Resumen del Director con una señal principal y siguiente acción.

### Criterios de aceptación

- Cada métrica incluye definición y fuente.
- Dato faltante no se convierte en cero.
- Se distingue orgánico, pago y estimado; el MVP no muestra pago si no está conectado.
- Los filtros sobreviven recarga cuando sea razonable.
- Loading, vacío, parcial y error están diseñados.

## 10. Epic D - Reels y análisis estándar

### Pipeline mínimo

1. Ingestar metadata y métricas.
2. Obtener media mediante un camino autorizado.
3. Extraer audio y transcribir con timestamps.
4. Muestrear escenas/frames de forma eficiente.
5. Extraer señales estructuradas.
6. Combinar señales con métricas e histórico.
7. Generar síntesis y recomendaciones.
8. Guardar versión, evidencia, costo y confianza.

### Salida visible

- Resumen ejecutivo.
- Hook verbal y visual.
- Mensaje/promesa.
- Estructura y ritmo.
- Texto, edición y presencia observables.
- CTA y objetivo aparente.
- Métricas y benchmark propio.
- Qué conservar, qué cambiar y qué probar.
- Evidencia citada.

### Criterios de aceptación

- Abrir el análisis guardado no reprocesa el video.
- Preguntar por el Reel recupera el artefacto existente.
- El lenguaje evita diagnósticos psicológicos.
- La salida no inventa una curva de retención.
- Fallos parciales conservan artefactos útiles y permiten retry.
- La versión del pipeline queda registrada.

## 11. Epic E - Stories

### Alcance condicionado

- Capturar Stories posteriores a la conexión.
- Agrupar piezas consecutivas en secuencias con regla configurable.
- Guardar media y métricas solamente dentro de permisos y retención acordados.
- Mostrar caída entre piezas y respuestas disponibles; si replies solo es consistente a nivel de cuenta, presentarlo como agregado del periodo y no atribuirlo a una Story concreta.
- Analizar función, secuencia, autoridad, objeción y CTA.

### Fallback si Meta limita el acceso

Si el spike no permite una experiencia confiable, el MVP debe:

- Comunicar la limitación.
- Mantener la arquitectura lista.
- Permitir análisis manual de una secuencia subida por el usuario solo si costos, privacidad y plazo lo permiten.
- No bloquear todo el lanzamiento por una promesa imposible.

## 12. Epic F - ADN de marca y negocio

### Formulario mínimo

- Nombre e imagen de marca.
- Nicho y descripción.
- Oferta principal.
- Precio/rango y modalidad.
- Cliente ideal.
- Problemas, deseos y objeciones.
- Diferenciadores y mecanismo.
- Tono de voz.
- Objetivo actual.
- CTA principal.

### Criterios de aceptación

- El usuario puede omitir y completar más tarde.
- El Director distingue vacío, dato confirmado e inferencia.
- Cambiar el ADN afecta nuevas respuestas, no reescribe artefactos históricos silenciosamente.
- La imagen del workspace puede ser logo o retrato.
- No se indexan documentos sin acción explícita.

## 13. Epic G - Director de Marketing IA

### Capacidades

- Chat con streaming.
- Crear, reabrir, renombrar, archivar y eliminar.
- Chat temporal.
- Adjuntar imagen y formatos documentales permitidos.
- Agregar referencias internas.
- Ideas, hooks, guiones, crítica y planificación.
- Explicaciones de métricas y uso de Zenovi.

### Criterios de aceptación

- El modelo no ve secretos.
- Cada tool revalida sesión, workspace y argumentos.
- Las citas abren el objeto correcto.
- Un adjunto no entra al RAG global.
- Un chat no recupera adjuntos de otro chat.
- El historial se resume para controlar contexto.
- El saldo se reserva y reconcilia por operación.
- Sin saldo, el historial permanece visible.
- Inputs y outputs peligrosos se controlan antes de ejecutar/renderizar.

## 14. Epic H - Baúl y calendario

### Objeto de contenido

- Título.
- Idea/brief.
- Formato.
- Objetivo.
- Hook.
- Guion/copy.
- CTA.
- Estado.
- Fecha objetivo/publicación.
- Contexto de origen.

### Criterios de aceptación

- El Director puede crear un borrador con confirmación.
- El usuario puede editar y mover de estado.
- Kanban y calendario representan los mismos datos.
- Una pieza conserva vínculo con el hallazgo o Reel que la originó.
- No se programa ni publica en Instagram en el MVP.

## 15. Epic I - Créditos y control de costos

### Comportamiento

- Saldo visible.
- Advertencias al 80 %, 95 % y 100 %.
- Costo visible antes de acciones costosas cuando sea posible.
- Historial resumido de consumo.
- Límites por operación y concurrencia.

### Criterios de aceptación

- No hay doble cargo por retry idempotente.
- Un job fallido reconcilia la reserva.
- El equipo ve costo real interno sin mostrar márgenes.
- Un workspace no puede superar el presupuesto duro configurado.

## 16. Epic J - Seguridad, privacidad y operación

### Checklist de salida

- RLS para todas las tablas tenant-aware.
- Tests negativos de acceso cruzado.
- Buckets privados y URLs firmadas.
- OAuth seguro y tokens cifrados.
- Webhooks firmados.
- Rate limiting.
- Sanitización y Content Security Policy.
- Prompt injection y tool abuse tests.
- Logs con redacción.
- Backup/restauración.
- Exportación/eliminación.
- Política, términos y contacto.
- Runbook de incidentes y revocación.

## 17. Datos e infraestructura del MVP

- Next.js App Router + TypeScript.
- Vercel para previews, staging y production.
- Supabase Auth, Postgres, RLS y Storage.
- Worker/workflow durable para multimedia y sincronización.
- FFmpeg en entorno compatible.
- Vercel AI SDK con router propio de proveedores.
- `pgvector` solo para conocimiento que realmente requiera recuperación semántica.
- Observabilidad de errores, jobs, latencia y costos.
- Feature flags para Stories, competidores y proveedores.

Las versiones exactas se fijarán al iniciar el repositorio y se actualizarán de forma controlada.

## 18. Modelo de calidad para IA

Antes de seleccionar proveedores se crea un set de evaluación con:

- Reels en español de distintos formatos.
- Stories de nutrición, autoridad y venta.
- Ofertas y avatares ficticios/consentidos.
- Preguntas estratégicas.
- Ejemplos de hooks y guiones calificados por humanos.

Se puntúa:

- Exactitud factual.
- Uso de evidencia.
- Conocimiento del rubro.
- Calidad de hook/guion.
- Especificidad.
- Consistencia de estructura.
- Latencia.
- Costo.
- Seguridad.

## 19. Eventos y dashboards internos

El MVP instrumenta el embudo completo:

`signup -> workspace -> OAuth -> account resolved -> sync -> ADN -> analysis -> chat -> idea -> scheduled`

Además se monitorean:

- Jobs por estado y retry.
- Errores por frontera.
- Costo por pipeline y workspace.
- Tiempo a primer valor.
- Recomendaciones útiles.
- Créditos usados y agotamiento.

## 20. Plan de ejecución de 6 semanas

### Semana 0 - Gates

- Entrevistas rápidas y selección de beta.
- Meta spike.
- Benchmark inicial de IA.
- Arquitectura y diseño de flujos.

### Semana 1 - Base

- Proyecto, CI/CD, ambientes.
- Auth, workspace, RLS.
- Shell visual y onboarding inicial.
- Esqueleto de observabilidad.

### Semana 2 - Meta y datos

- OAuth, estados e integración.
- Modelo de media/métricas.
- Sincronización inicial.
- Dashboard vacío/parcial/real.

### Semana 3 - Análisis

- Pipeline de Reel.
- Transcripción, frames y artefactos.
- UI de Reels y detalle.
- Cost tracking.

### Semana 4 - Director y ADN

- ADN mínimo.
- Chat persistente, streaming, RAG y tools.
- Adjuntos temporales y referencias internas.
- Evaluaciones de calidad y seguridad.

### Semana 5 - Baúl, Stories y cierre

- Baúl Kanban/calendario.
- Stories según viabilidad.
- Créditos, feedback y ajustes.
- Políticas y flujos de eliminación.

### Semana 6 - Hardening y beta

- E2E, performance, seguridad y accesibilidad.
- Corrección de onboarding.
- Runbooks y panel operativo.
- Deploy de beta y onboarding de primeros usuarios.

Este cronograma es agresivo. Stories, competidores o análisis multimodal avanzado deben recortarse antes que seguridad, conexión, Director o ciclo Reel -> idea.

## 21. Beta de tres meses

- 10 testers, incorporación escalonada.
- Cohorte inicial de 2-3 para detectar bloqueos.
- Entrevista de 30-45 minutos al inicio.
- Revisión semanal de telemetría.
- Conversación quincenal con cada tester o cohorte.
- Encuesta rápida tras análisis y guiones.
- Registro de solicitudes sin comprometer scope automáticamente.
- Informe mensual de uso, costos, valor y riesgos.

## 22. Release gates

### Gate 1 - Alpha interna

- Auth, RLS y workspace verificados.
- Conexión de cuenta del equipo.
- Un Reel procesado end-to-end.

### Gate 2 - Beta cerrada

- Cuenta externa conectada.
- Política y consentimiento disponibles.
- Errores de OAuth accionables.
- Costos y límites activos.
- Backups y revocación probados.

### Gate 3 - Beta ampliada

- Activación repetible.
- Sin incidentes críticos de aislamiento.
- Calidad IA mínima aprobada.
- Soporte y panel operativo funcionales.

### Gate 4 - Pago

- Retención y disposición a pagar observadas.
- Márgenes modelados.
- Entitlements y facturación probados.
- App Review y permisos estables.

## 23. Criterios de recorte

Si el plazo se compromete, recortar en este orden:

1. Dark mode.
2. Competidores.
3. Búsqueda/fijado de chats.
4. Calendario avanzado.
5. Análisis manual alternativo de Stories.
6. Parte sofisticada del dashboard.

No recortar:

- Seguridad y aislamiento.
- OAuth robusto.
- Exactitud y procedencia de métricas.
- Control de costos.
- Calidad esencial del análisis estándar.
- Historial y contexto básico del Director.
- Eliminación/revocación.

## 24. Decisiones pendientes antes de congelar scope

- Resultado del spike de Stories.
- Business vs Creator y flujo de login elegido.
- Competidores dentro o después de la beta inicial.
- Retención de adjuntos.
- Modelos ganadores y costo por operación.
- Política exacta de créditos para testers.
- Color semántico de enlaces/focus dentro del sistema monocromático.
- Formatos documentales admitidos.
- Proveedor de email, errores y analítica de producto.

## 25. Aprobación

| Área | Responsable | Estado |
|---|---|---|
| Problema/ICP | Socios | Pendiente |
| Scope MVP | Socios + producto | Pendiente |
| Meta/API | Desarrollo | Pendiente de spike |
| IA/calidad | Desarrollo + socios | Pendiente de benchmark |
| Diseño | Socios | Dirección monocromática aceptada; detalle pendiente |
| Seguridad/legal | Socios + asesoría | Pendiente |
| Beta | Comercial | Pendiente de selección |

## 26. Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1 | 2026-08-28 | Primera especificación consolidada del MVP |
