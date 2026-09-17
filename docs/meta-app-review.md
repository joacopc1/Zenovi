# Revisión de la app de Meta

Material para pedir acceso avanzado a los permisos de Instagram y pasar la app a producción, sin tener que agregar a cada usuario como probador.

- App de Meta: `Zenovi` · 1081467611489365
- App de Instagram: `Zenovi-IG` · 1653657912774149 (la que usa Zenovi para iniciar sesión)
- URL de la app: `https://app.zenovi.app`

## Estrategia

**Se pide la revisión por lo que Zenovi hace hoy, no por lo que va a hacer.** Los revisores prueban la app y comparan contra el video: una función descrita que no pueden encontrar es motivo de rechazo. Hoy Zenovi muestra el perfil, la biblioteca de contenido y las analíticas; eso es lo que se describe.

Cuando salga el análisis de Reels con IA, **hay que actualizar el caso de uso y volver a enviarlo**. Las Condiciones de la Plataforma (3.a.vii) no permiten cambiar la función principal ni el tratamiento de datos sin pasar otra vez por la revisión, y ese análisis usa el video de cada pieza para algo nuevo. La política de privacidad ya lo describe, así que ese cambio no la toca.

**Los textos del formulario van en inglés.** El panel está en español, pero los revisores son un equipo global y el inglés evita malentendidos. El video puede mostrar la app en español si lleva subtítulos o notas en inglés.

## Permisos que se piden

Zenovi pide exactamente estos dos (`lib/meta/oauth.ts`). **No agregar** `instagram_business_manage_comments` ni `instagram_business_manage_messages` aunque el panel los sugiera: Zenovi no los usa, y pedir permisos que la app no usa es causa de rechazo.

### `instagram_business_basic`

**Qué lee Zenovi con este permiso**

- Perfil: `id`, `username`, `account_type`, `profile_picture_url`, `followers_count`, `follows_count`, `media_count`.
- Contenido: `id`, `caption`, `media_type`, `media_product_type`, `media_url`, `thumbnail_url`, `permalink`, `timestamp`, `like_count`, `comments_count`.

**Texto para el formulario** (en *Cómo usará tu app este permiso*):

> Zenovi is a marketing analytics assistant for creators, coaches and educators who grow their business on Instagram. After a user connects their Instagram professional account, we use instagram_business_basic to identify the account and show its profile (username, profile picture, account type and follower count) in the app header, so the user always knows which account they are analyzing.
>
> We also use it to read the user's own published Reels and posts (caption, thumbnail, media type, permalink and publish date) and build their content library. The library lets the user browse, search and sort their content, and open each piece to see how it performed. Without this permission Zenovi cannot list the user's content, which is the core of the product.
>
> Zenovi only reads data. It never publishes, comments or sends messages on the user's behalf. Users can disconnect Instagram and delete all their data at any time from Settings.

### `instagram_business_manage_insights`

**Qué lee Zenovi con este permiso**

- De la cuenta: `views`, `reach`, `profile_views`, `accounts_engaged`, `total_interactions`, `profile_links_taps`, `follower_count` y `follower_demographics` (edad, género, país y ciudad, agregados), más los desgloses de visualizaciones por tipo de contenido y por seguidores.
- De cada pieza: `views`, `reach`, `likes`, `comments`, `shares`, `saved`, `total_interactions` y, en Reels, `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time` y `reels_skip_rate`.

**Texto para el formulario:**

> We use instagram_business_manage_insights to show creators how their account and content perform, so they can decide what to create next.
>
> In the Analytics section, users see their views, reach, interactions, profile visits and link taps for the last 7, 30 or 90 days, compared with the previous period, along with daily charts. The Audience tab shows the aggregated demographics of their followers (age range, gender, country and city); these are totals and never identify individual followers.
>
> For each Reel or post, users see its views, reach, likes, comments, shares, saves and, for Reels, average watch time and skip rate. Zenovi compares each piece against the typical performance of the user's own content so they can spot what worked.
>
> Insights are only shown to the account owner who connected them, are never sold or shared for advertising, and are deleted when the user disconnects Instagram.

## Instrucciones para los revisores

Van en el campo de *instrucciones de prueba* o *detalles de verificación de la app*. Antes de enviar, **crear un usuario de Zenovi exclusivo para la revisión** (email y contraseña, no Google) y completar las credenciales abajo.

> 1. Go to https://app.zenovi.app/login and sign in with the test credentials below.
> 2. On first sign-in you will be asked to connect Instagram. Click "Conectar con Instagram" (Connect with Instagram) and log in with any Instagram professional account (Business or Creator). Approve the two requested permissions.
> 3. After connecting, click "Sincronizar ahora" (Sync now). The first sync takes up to a minute.
> 4. instagram_business_basic: the account username and profile picture appear in the top-left account selector. Open "Contenido" (Content) in the sidebar to see the library of Reels and posts.
> 5. instagram_business_manage_insights: open "Analíticas" (Analytics) in the sidebar. Use the tabs to see views and reach (Visibilidad), interactions (Engagement), content performance (Contenido), followers (Comunidad) and follower demographics (Audiencia). Demographics require an account with at least 100 followers.
> 6. Data deletion: open "Ajustes" (Settings) and use "Desconectar Instagram" (Disconnect Instagram) to remove the connection and delete all stored data.
>
> The app is in Spanish; the English labels are given in parentheses.
>
> Test credentials — Email: [completar] · Password: [completar]

**No compartir credenciales de ninguna cuenta de Instagram real**: los revisores conectan sus propias cuentas de prueba, y compartir un acceso a Instagram viola sus condiciones.

## Guion del video

Un solo video sirve para los dos permisos si muestra claramente dónde se usa cada uno. Meta pide que se vea **el flujo completo desde el inicio de sesión**, con la pantalla de permisos a la vista.

- Grabar la pantalla en una resolución que se lea, sin editar cortes que oculten pasos.
- Duración orientativa: 2 a 3 minutos.
- Agregar subtítulos o carteles en inglés en cada toma (entre comillas abajo).
- Usar una cuenta de Instagram con al menos 100 seguidores, así se ve también la demografía.

| # | Qué se muestra | Cartel en inglés |
|---|---|---|
| 1 | `app.zenovi.app/login`: iniciar sesión con el usuario de prueba. | "Signing in to Zenovi." |
| 2 | Pantalla de conectar Instagram, con el texto que explica qué datos se piden. Click en *Conectar con Instagram*. | "The user connects their Instagram professional account." |
| 3 | **La pantalla de consentimiento de Instagram**, quieta unos segundos para que se lean los dos permisos. Aceptar. | "Instagram asks the user to approve instagram_business_basic and instagram_business_manage_insights." |
| 4 | Vuelta a Zenovi y sincronización. | "Zenovi syncs the account." |
| 5 | Selector de cuenta arriba a la izquierda: usuario y foto. | "instagram_business_basic: account username and profile picture." |
| 6 | *Contenido*: la biblioteca de Reels, abrir una pieza. | "instagram_business_basic: the user's own Reels and posts." |
| 7 | En esa misma pieza, sus métricas: visualizaciones, alcance, interacciones, tiempo de reproducción. | "instagram_business_manage_insights: performance of each piece." |
| 8 | *Analíticas* → *Visibilidad*: cifras del período y gráfica diaria. Cambiar de 30 a 7 días. | "instagram_business_manage_insights: account views, reach and profile activity." |
| 9 | *Engagement* y *Comunidad*, pasando rápido. | "instagram_business_manage_insights: interactions and follower growth." |
| 10 | *Audiencia*: género, edad, país y ciudad. | "instagram_business_manage_insights: aggregated follower demographics." |
| 11 | *Ajustes* → *Desconectar Instagram*: mostrar la confirmación (no hace falta confirmar). | "Users can disconnect Instagram and delete their data at any time." |

## Antes de enviar

- [ ] Política de privacidad y términos publicados y revisados por los tres socios.
- [ ] En *Información básica*: URL de privacidad, URL de términos, ícono de 1024×1024, categoría y email de contacto.
- [ ] En *Eliminación de datos de usuario*: "URL de las instrucciones" apuntando a `https://app.zenovi.app/privacy#eliminacion`.
- [x] En la configuración de inicio de sesión de empresa de Instagram: URL de desautorización y de eliminación de datos → `https://app.zenovi.app/api/integrations/instagram/data-deletion`.
- [ ] Prueba del borrado desde Instagram confirmada con los registros de Vercel.
- [ ] Usuario de prueba creado con email y contraseña, **con el workspace ya creado** —si no, el revisor cae en el paso de crear marca antes que en el de conectar Instagram, y las instrucciones no coinciden— y credenciales cargadas en las instrucciones.
- [ ] Verificación del negocio, si el panel la exige.
- [ ] Video grabado con los carteles en inglés.
