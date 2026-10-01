# Activar el respaldo de IA de Zenovi

Zenovi usa Gemini como proveedor principal. Si Gemini alcanza un límite o queda temporalmente
indisponible, el sistema intenta el análisis mediante Vercel AI Gateway con esta cadena:

1. `anthropic/claude-sonnet-4.6`
2. `openai/gpt-5.4`

## Por qué no hace falta crear cuentas de Claude u OpenAI

AI Gateway es el intermediario. Zenovi se autentica contra Vercel y Vercel envía el pedido al
modelo elegido. Por eso, con las credenciales administradas por Vercel, no hacen falta
`ANTHROPIC_API_KEY` ni `OPENAI_API_KEY`, ni hay que descargar o instalar un modelo.

Si más adelante se prefiere pagar directamente a Anthropic u OpenAI, Vercel permite agregar
esas claves mediante BYOK. Es opcional y no es necesario para que el respaldo funcione.

## Lo que hay que hacer en Vercel

1. Entrar al equipo donde está el proyecto `zenovi`.
2. Abrir **AI Gateway** en el panel de Vercel.
3. Activar el servicio y comprobar que haya créditos disponibles. Vercel ofrece crédito
   gratuito para empezar; si se agota, hay que comprar créditos o configurar una recarga.
4. Configurar un presupuesto o límite de gasto antes de usarlo en producción.
5. Hacer un nuevo deployment después de subir estos cambios al repositorio.

En los deployments de Vercel no hace falta agregar otra variable: Vercel entrega y renueva
automáticamente `VERCEL_OIDC_TOKEN`. Zenovi y AI SDK la leen del lado del servidor.

Documentación oficial:

- [AI Gateway](https://vercel.com/docs/ai-gateway)
- [Autenticación y BYOK](https://vercel.com/docs/ai-gateway/authentication-and-byok)
- [Precios y créditos](https://vercel.com/docs/ai-gateway/pricing)
- [Fallbacks entre modelos](https://vercel.com/docs/ai-gateway/models-and-providers/model-fallbacks)

## Para probarlo localmente

La opción más simple es crear una clave desde **AI Gateway → API Keys** y agregarla únicamente
a `.env.local`:

```bash
AI_GATEWAY_API_KEY=tu_clave_privada
```

No usar el prefijo `NEXT_PUBLIC_`: la clave nunca debe llegar al navegador ni guardarse en Git.

Como alternativa, se puede vincular la carpeta al proyecto y traer un OIDC temporal con
`vercel env pull`. Ese token vence y hay que renovarlo periódicamente; para desarrollo diario,
la API key del Gateway suele resultar más cómoda.

## Cambiar los modelos sin editar código

Estas variables son opcionales. Si no existen, Zenovi utiliza la cadena indicada al comienzo:

```bash
AI_GATEWAY_MODEL=anthropic/claude-sonnet-4.6
AI_GATEWAY_FALLBACK_MODEL=openai/gpt-5.4
```

Los identificadores deben existir en el [catálogo de modelos de AI Gateway](https://vercel.com/ai-gateway/models).
Cambiar un modelo modifica costo, velocidad y capacidades, por lo que conviene probar el contrato
estructurado antes de cambiarlo en producción.

## Qué calidad conserva el respaldo

- **Guion:** usa la transcripción completa; no pierde información visual porque esa tarea sólo
  clasifica bloques del texto.
- **Reels:** los proveedores externos reciben transcripción, métricas y portada. El resultado
  queda marcado internamente como modalidad reducida y no puede afirmar que vio edición,
  movimiento o audio del video completo.
- **Historias:** reciben las imágenes y las portadas disponibles, identificadas por número de
  slide. Para una Historia en video, una portada no reemplaza el movimiento ni el audio.

El análisis completo del MP4 sigue siendo responsabilidad de Gemini. El Gateway existe para que
un límite temporal no bloquee toda la función, sin presentar evidencia parcial como si fuera
evidencia completa.

## Cómo comprobar que está funcionando

1. Verificar que el deployment esté listo.
2. Ejecutar un análisis normalmente.
3. Abrir **AI Gateway → Logs** en Vercel.
4. Si Gemini falló y se activó el respaldo, allí aparecerá el modelo que respondió, latencia,
   tokens y costo. Zenovi también escribe el evento `ai_provider_fallback` en los logs del servidor.

No hace falta quitar `GEMINI_API_KEY`: Gemini continúa siendo el proveedor principal.
