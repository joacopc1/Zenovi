# Hallazgos de la prueba gratuita de Moka

Actualizado: 2026-09-22

## Modelo de IA de Moka

**[O] 2026-09-22:** Moka declara usar **Claude Sonnet 4** como modelo de IA. Dato para el benchmark propio de Zenovi: es un ancla de referencia, no una decisión. Zenovi elegirá su stack por evidencia (calidad en español, latencia, costo, estructuras), no por imitación de competidores.

## Primer acceso y onboarding

Evidencia observada en `usearko.io/onboarding`:

- Al crear la cuenta se genera directamente un workspace de demostración.
- El primer paso útil consiste en conectar una cuenta de Instagram Business.
- No aparece previamente una entrevista sobre negocio, oferta, avatar o ADN de marca.
- Las secciones avanzadas permanecen bloqueadas hasta conectar Meta.
- La interfaz ya muestra Dashboard, Reels e Historias; y como módulos bloqueados Espía, Tu audiencia, Ventas, Mesa de trabajo y Moka AI.
- ADN de Marca aparece como una sección independiente.

Interpretación: Moka sí posee un onboarding, pero actualmente está centrado en la conexión de datos. La ausencia de onboarding estratégico previo puede ser una decisión de reducción de fricción o una señal de producto temprano; no puede afirmarse únicamente por estas pantallas.

## Conexión de Meta

Moka declara utilizar Meta OAuth y solicitar permisos de lectura.

Datos declarados en pantalla:

- Perfil público de Instagram.
- Reels, fotos y videos.
- Métricas de rendimiento del contenido.
- Páginas de Facebook vinculadas.
- Datos de engagement de las páginas.
- Métricas de Meta Ads en modo lectura.

No se declara acceso a mensajes o conversaciones en esta pantalla. El acceso a DMs requiere permisos adicionales y no debe asumirse como parte de la conexión actual de Moka.

Las capturas móviles confirman que Moka utiliza un flujo de autorización de Meta/Facebook orientado a integraciones comerciales, y no un formulario propio ni únicamente un login simplificado de Instagram.

### Evidencia del flujo móvil

El 28 de agosto de 2026 se observó esta secuencia completa:

1. Redirección a `facebook.com` e inicio de sesión de Facebook.
2. Confirmación de identidad: Moka recibe nombre y foto de perfil y solicita acceso continuo.
3. Selección de páginas de Facebook, con opciones para activos actuales y futuros o solo activos actuales seleccionados.
4. Selección de cuentas de Instagram bajo el mismo criterio.
5. Revisión y aceptación de capacidades solicitadas.
6. Confirmación de Meta de que la persona se conectó a Moka como integración comercial.
7. Retorno a `app.usemoka.io`.

Capacidades visibles en el consentimiento:

- Acceder a anuncios de Facebook y estadísticas relacionadas.
- Administrar el negocio o portfolio comercial seleccionado.
- Acceder al perfil y las publicaciones de la cuenta de Instagram.
- Acceder a estadísticas de la cuenta de Instagram.
- Leer contenido publicado en las páginas.
- Mostrar la lista de páginas administradas.

No apareció ningún permiso de mensajes, conversaciones o DMs. Esto refuerza que los DMs no forman parte de esta conexión observada.

La frase de Moka `solo lectura` no describe con suficiente precisión lo que Meta presenta al usuario: el consentimiento incluye una capacidad denominada `Administrar tu negocio` y una explicación sobre administración de elementos del portfolio. Aunque Moka podría limitar voluntariamente sus operaciones a lectura, la autorización percibida es más amplia. Para Zenovi, este es un riesgo de confianza y conversión que debe evitarse o explicarse con exactitud.

## Promesas visibles

- Métricas orgánicas, pagas, engagement, retención y más.
- Diagnóstico de hook, guion, visual y CTA con IA.
- Benchmark de 90 días comparando cada Reel contra el promedio y detectando mejores rendimientos.

El benchmark de 90 días coincide conceptualmente con límites habituales de disponibilidad de ciertos insights de cuenta de Meta. La procedencia exacta de la retención todavía debe validarse.

## Competencia y Trial Reels

El Loom público confirma una función de competencia más amplia que un simple benchmark por URL:

- El usuario agrega un competidor mediante su `@` de Instagram; no necesita acceso a la cuenta de ese competidor.
- Moka rastrea automáticamente el contenido nuevo y diferencia Reels normales de Trial Reels.
- Conserva una evolución visible de views por pieza y muestra métricas públicas como views, likes y comentarios.
- Permite abrir la pieza en Instagram, transcribirla y ejecutar un análisis de tipo de video, hook, promesa central y razones de rendimiento.
- La IA puede consultar en conjunto las transcripciones y resultados de varios competidores para identificar temas y patrones.
- La interfaz observada muestra explícitamente `Scrape`, un contador `100 Reels` y `8 analizados`. La captura no demuestra que se rendericen exactamente 100 tarjetas, que el competidor tenga exactamente 100 publicaciones totales ni cuál es la ventana utilizada para ese contador.

La pantalla observada sí separa claramente **contenido disponible/rastreado** de **contenido analizado**. Las piezas ya procesadas ofrecen `Ver análisis`; las restantes ofrecen `Analizar`. Esto sugiere una arquitectura deliberada de dos niveles:

1. Rastreo relativamente económico de metadata pública y snapshots de métricas.
2. Transcripción, extracción visual y razonamiento de IA únicamente cuando el usuario selecciona una pieza.

El Loom no explica si cada análisis descuenta créditos ni cuál es su precio. El contador visible de Moka hace razonable esa hipótesis, pero debe registrarse como inferencia hasta comprobarla dentro del producto.

Conclusión: esta función no puede provenir de los insights privados del competidor, porque el competidor no autorizó a Moka. La evidencia indica recopilación de información pública mediante scraping o un proveedor equivalente, combinada con seguimiento periódico y análisis de IA. Meta ofrece capacidades limitadas de metadata pública de cuentas profesionales a través de la ruta con Facebook Login, pero eso no demuestra que entregue Trial Reels, descarga completa, histórico de views ni todo lo observado en Moka.

Para Zenovi, `Competencia` debe investigarse como un subsistema separado de la conexión oficial del propietario. Antes de incluirlo hay que validar fuente de datos, términos de uso, estabilidad, costos, retención, eliminación y qué puede afirmarse como métrica pública frente a inferencia. No debe bloquear el spike orgánico de Meta ni asumirse viable por el solo hecho de que Moka lo muestre.

La forma recomendada de replicar el principio —si la fuente de datos resulta viable— es indexar primero el catálogo público y cobrar créditos solo por operaciones costosas y explícitas. La transcripción debe guardarse como artefacto reutilizable del análisis para que el usuario pueda leerla, citarla y consultarla desde el Director sin volver a procesar el video.

### Qué es un Trial Reel

Trial Reels es una función nativa de Instagram: una pieza se distribuye primero a no seguidores para probar una idea, formato o tema. El creador puede revisar métricas iniciales y luego compartirla con todos o automatizar su publicación general si rinde bien. En el Loom, Moka afirma detectarlos tanto en la cuenta propia como en competidores; esa detección externa es una capacidad particular de su sistema, no un permiso estándar demostrado de la API oficial.

### Carga manual de Reels

El Loom revisado no confirma una función para subir manualmente un Reel propio a Moka. Sí confirma carga manual de ventas y asociación con una pieza de contenido. Por ahora, la carga manual de video debe mantenerse como fallback propuesto para Zenovi y no como función copiada o verificada de Moka.

## Inventario de la vista de un Reel (2026-09-27)

Observado en el Loom "Mi sistema de contenido (Moka por dentro)". Es lo que Moka muestra
al abrir una pieza, marcado contra lo que tiene Zenovi hoy.

### Lo que Moka tiene y Zenovi ya tiene

- Views, alcance, engagement (interacciones/views) y watch time promedio.
- Retención como tiempo medio sobre duración. Moka la marca **"estimada"**, y hace bien:
  no es una curva de retención real, es un promedio dividido por la duración.
- Rendimiento de la pieza contra el resto — su "4.5x", nuestro multiplicador.
- Interacciones vs. benchmark con la diferencia en por ciento. **Agregado el 2026-09-27**
  a partir de estas capturas: antes Zenovi comparaba sólo dos métricas y sin el "57% más
  alto", que es como el mercado lo lee.
- Ratios clave (interacciones/views, saves/views).

### Lo que Moka tiene y Zenovi no

- [ ] **Curva de views por día de la pieza.** Moka dibuja el arco completo desde que se
  publicó. Zenovi guarda snapshots diarios desde el 2026-09-24, así que para piezas
  anteriores no existe ese histórico y no se puede reconstruir: Meta no lo entrega.
- [ ] **Benchmark con ventana de 90 días** ("vs benchmark 90d"). Zenovi compara contra la
  mediana de todo lo que hay. Una ventana móvil refleja mejor la cuenta de hoy, sobre todo
  si creció.
- [ ] **Views por día de semana**, en radar, con "día con más views". Necesita el histórico
  diario por pieza que recién se está juntando.
- [ ] **Abandono promedio** en segundos (duración menos tiempo medio visto). Es una resta
  de datos que ya tenemos.
- [ ] **Filtro Reel / Trial reel / Todos** en la biblioteca. Lo consiguen raspando (ver
  abajo); la API no expone los Trial Reels.
- [ ] **Filtro orgánico / pagado** y monto invertido por pieza. Requiere la API de Ads.
- [ ] **Resumen del conjunto** ("88 reels": totales de views, likes, guardados, comentarios
  y un anillo de engagement).
- [ ] **Ordenar la biblioteca por métrica** con dirección (mayor→menor).

### El análisis de IA de Moka, sección por sección

Lo que muestra su "Análisis MokaAI", para tener el techo contra el que compararse:

- [ ] **Transcripción con marcas de tiempo y etiquetas** por tramo: `HOOK 0:00`,
  `DEVELOPMENT 0:06`, `CTA 1:48`. No es un bloque de texto: cada párrafo va rotulado con
  su función y su minuto.
- [ ] **Narrativa y estructura**: hook textual, un párrafo que describe cómo se desarrolla,
  la **promesa central** en una frase, el **CTA detectado** y una etiqueta de tema.
- [ ] **Análisis visual**: formato (talking head), tipo de plano, escena (interior),
  orientación, cantidad de personas, si la cara está visible, el **texto en pantalla**, una
  descripción del **primer frame** y del fondo.
- [ ] **Tono de voz y delivery**: etiquetas (educativo, informal, rápido), descripción del
  tipo de voz y **velocidad estimada en palabras por minuto**.
- [ ] **Insights y potencial viral**: un veredicto (alto/medio/bajo) con su fundamento, y
  fortalezas.
- [ ] **Re-analizar** a demanda.
- [ ] **Chat sobre la pieza** ("Pregúntale a Moka").

### Cómo consiguen lo que la API no da

En el bloque de retención, la duración del Reel aparece marcada como **"Apify / DB"**.
Apify es una plataforma de scraping: esos datos no salen de la Graph API, los raspan. Eso
explica los Trial Reels y la duración del video.

Zenovi obtiene la duración leyendo el archivo de video en el navegador, que no cuesta nada
ni depende de un tercero, así que **por ese dato no hace falta raspar**.

### Trial Reels: por qué raspar no alcanza, y por qué igual importa

La etiqueta "Apify / DB" está junto a la **duración**, no junto al filtro de Trial Reels, así
que no prueba de dónde salen los segundos. Y hay un motivo estructural para dudarlo: **un
Trial Reel no aparece en el perfil ni en la pestaña de Reels** —se le muestra sólo a quien
no sigue a la cuenta—, así que raspar un perfil público no los devolvería nunca. La única
vista donde el creador los ve es la suya, dentro de la app de Instagram.

Eso convierte el scraping de Trial Reels en un problema distinto del resto:

| Camino | Qué se arriesga |
|---|---|
| Raspar perfiles públicos | Los términos de la plataforma. El riesgo es de Zenovi: bloqueo de IPs, y de la app si Meta lo detecta. |
| Raspar con la sesión del creador | Los términos **y la cuenta del usuario**: Instagram suspende cuentas con automatización sobre su sesión. |

El segundo es el que haría falta, y es inaceptable para una herramienta que le pide a alguien
conectar su Instagram: no se arriesga la app, se arriesga al cliente.

**Pero el problema no se puede ignorar** (Joaco, 2026-09-27): *las marcas personales están
usando muchísimo los Trial Reels hoy*. Si una cuenta publica la mitad de su contenido como
prueba y Zenovi no los distingue, pasan dos cosas, las dos malas: el benchmark del formato
se corre —un Trial Reel se muestra sólo a no seguidores, así que su alcance y sus
interacciones no son comparables— y el creador ve veredictos sobre piezas que ni siquiera
buscaban el mismo resultado.

- [ ] **Probar el camino de Facebook Login**, que es una superficie más rica y sí soporta
  introspección. La sonda está escrita (`scripts/probe-trial-reels-facebook.mjs`); falta el
  token. Es el único camino limpio que queda sin agotar.
- [ ] **Si ese camino falla**, la alternativa honesta es que el creador marque la pieza como
  prueba a mano. Es trabajo manual, pero acá sí se justifica: sin esa marca el benchmark
  miente, y una marca por pieza es más barata que un número equivocado.

## Próximas evidencias necesarias

- Confirmar si requiere página de Facebook y cuenta Business o acepta Creator.
- Registrar tiempo y profundidad histórica de la primera sincronización.
- Comparar un Reel con Instagram Insights nativo.
- Confirmar qué significa “retención” y si existe una curva por segundo.
- Determinar cómo funciona el módulo Ventas sin acceso declarado a DMs.
- Determinar el proveedor o mecanismo usado para rastrear competidores y Trial Reels públicos.
- Verificar contractual y técnicamente si ese mecanismo es reproducible de forma estable.
- Confirmar en la app, fuera del Loom, si existe carga manual de videos propios.
- Verificar qué activos tenía seleccionados la cuenta de prueba y si la cuenta de Instagram profesional estaba correctamente vinculada a una página o portfolio.

## Fallo observado al iniciar OAuth

El 28 de agosto de 2026, al pulsar `Conectar con Meta`, la interfaz permaneció cargando y finalmente falló la página sin completar la conexión.

Una prueba posterior desde móvil avanzó por todo el consentimiento de Meta. Meta mostró el mensaje de conexión completada, pero al regresar a Moka la aplicación indicó simultáneamente:

- `La conexión con Meta está pendiente de verificación`.
- `No hay cuenta de Instagram conectada`.
- Opción de reconectar o reintentar.

Estado actualizado del hallazgo:

- Reproducibilidad: el inicio falló en escritorio; en móvil la autorización de Meta se completó, pero Moka no activó la cuenta.
- Causa raíz: desconocida.
- Frontera del fallo mejor localizada: posterior al consentimiento de Meta y durante el callback, verificación del token, resolución de activos/cuenta elegible o activación de la sincronización en Moka.
- No hay evidencia suficiente para elegir una causa concreta. También podría existir una incompatibilidad en la relación entre usuario, página, portfolio y cuenta profesional de Instagram.
- La pantalla genérica `pendiente de verificación` no permite al usuario comprender si debe esperar, corregir activos o contactar soporte.

### Hipótesis de cuenta personal no elegible

Existe una hipótesis concreta todavía no confirmada: la persona pudo iniciar sesión con Facebook correctamente, pero la cuenta de Instagram asociada era personal y privada, no una cuenta profesional Business o Creator compatible con la API.

La documentación de la plataforma de Instagram indica que la API está orientada a cuentas profesionales Business y Creator, y que el flujo con Facebook Login no puede acceder a cuentas personales. Esto encaja con el patrón observado: Meta autoriza a la persona y registra la integración, pero Moka no consigue resolver una cuenta de Instagram elegible al regresar.

Para confirmar o descartar esta hipótesis basta una comprobación mínima: verificar el tipo de la cuenta exacta de Instagram seleccionada y, para el flujo usado por Moka, su relación con la página de Facebook correspondiente. Hasta hacerlo, no debe presentarse como causa raíz.

Evidencia necesaria para aislarlo:

- Tipo de cuenta de Instagram, página vinculada, portfolio y nivel de acceso del usuario de prueba.
- URL del callback después de volver desde Meta, ocultando parámetros sensibles.
- Network del callback y de la primera consulta de estado, identificando status y dominio.
- Respuesta o código interno que explique por qué Moka no resolvió una cuenta elegible.
- Resultado de un intento controlado seleccionando únicamente los activos actuales necesarios.

## Lecciones para Zenovi

- La autorización de Meta y la conexión funcional deben tratarse como estados distintos.
- La integración debe registrar etapas explícitas: OAuth iniciado, consentimiento recibido, callback validado, token verificado, cuenta de Instagram resuelta, sincronización inicial en cola y conexión activa.
- Los callbacks y reintentos deben ser idempotentes para no duplicar cuentas ni perder una autorización válida.
- El error visible debe indicar la causa accionable: sin cuenta profesional elegible, sin página vinculada, permisos insuficientes, token inválido, activo no seleccionado o fallo temporal.
- Debe aplicarse autorización progresiva: pedir solo lo indispensable para las analíticas orgánicas del MVP y solicitar Ads o DMs únicamente cuando el usuario active esas integraciones.
- Debe preferirse que el usuario elija activos concretos actuales. El acceso a todos los activos futuros aumenta fricción y debe justificarse si alguna vez es necesario.
