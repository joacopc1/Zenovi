import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT, LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Política de privacidad · Zenovi",
  description: "Qué datos trata Zenovi, para qué, con quién los comparte y cómo borrarlos.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      documentId="privacy"
      title="Política de privacidad"
      intro={
        <>
          <p>
            Zenovi es un Director de Marketing con inteligencia artificial para creadores, coaches e
            infoproductores. Para funcionar, necesita leer datos de tu cuenta de Instagram y de lo
            que cargás en la aplicación. Esta política explica qué datos tratamos, para qué, con quién
            los compartimos, cuánto tiempo los guardamos y cómo podés borrarlos.
          </p>
          <p>
            La versión corta: <strong>no vendemos tus datos, no leemos tus mensajes directos, no
            publicamos nada en tu nombre, y podés borrar todo en cualquier momento.</strong>
          </p>
        </>
      }
      sections={[
        {
          id: "responsables",
          title: "Quiénes somos",
          content: (
            <>
              <p>
                Zenovi es un proyecto operado por <strong>Joaquín Piñeyro</strong>, <strong>Samuel
                Romero</strong> y <strong>Juan Marcos Pimienta</strong>, personas físicas residentes en
                Uruguay, que actúan como responsables del tratamiento de los datos hasta la
                constitución de una sociedad. Cuando eso ocurra, actualizaremos esta política.
              </p>
              <p>
                Contacto: <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a> ·{" "}
                {LEGAL_CONTACT.phone}
              </p>
            </>
          ),
        },
        {
          id: "datos",
          title: "Qué datos tratamos",
          content: (
            <>
              <p><strong>Tu cuenta de Zenovi.</strong> Nombre, email y, si entrás con Google, tu foto de perfil. Si usás email y contraseña, la contraseña la guarda cifrada nuestro proveedor de autenticación: nosotros nunca la vemos.</p>
              <p><strong>Tu cuenta de Instagram, sólo si la conectás.</strong> Con tu autorización, y únicamente a través de la API oficial de Meta, leemos:</p>
              <ul>
                <li>El perfil de la cuenta profesional: nombre de usuario, foto, tipo de cuenta y cantidad de seguidores, seguidos y publicaciones.</li>
                <li>Tu contenido publicado: Reels y publicaciones, con su texto, miniatura, enlace y fecha.</li>
                <li>Las métricas de cada pieza y de la cuenta: visualizaciones, alcance, interacciones, guardados, compartidos, visitas al perfil y toques en el enlace, entre otras.</li>
                <li>La demografía de tus seguidores en forma agregada —rangos de edad, género, país y ciudad—. Son totales: no identifican a ningún seguidor.</li>
              </ul>
              <p>
                <strong>No accedemos</strong> a tus mensajes directos, a tu contraseña de Instagram, a
                datos individuales de tus seguidores ni a ninguna función para publicar, comentar o
                modificar tu cuenta.
              </p>
              <p><strong>Lo que cargás en Zenovi.</strong> La información de tu marca y tu negocio, tus conversaciones con el Director IA, los archivos que adjuntás y tus ideas y guiones.</p>
              <p><strong>Pagos.</strong> Los procesa Polar, que actúa como revendedor. Zenovi no recibe ni guarda los datos de tu tarjeta.</p>
              <p><strong>Datos técnicos y de uso.</strong> Dirección IP, navegador, dispositivo, páginas visitadas y registros técnicos necesarios para operar y proteger el servicio.</p>
            </>
          ),
        },
        {
          id: "finalidades",
          title: "Para qué los usamos",
          content: (
            <ul>
              <li>Mostrarte las analíticas de tu cuenta y de tu contenido.</li>
              <li>Analizar tus piezas y darte recomendaciones con el Director IA.</li>
              <li>Gestionar tu cuenta, tu plan, tus créditos y los pagos.</li>
              <li>Mantener el servicio seguro, prevenir abusos y resolver fallas.</li>
              <li>Entender cómo se usa Zenovi para mejorarlo, con datos agregados.</li>
              <li>Comunicarte cambios importantes del servicio o de estas políticas.</li>
            </ul>
          ),
        },
        {
          id: "ia",
          title: "Cómo usamos la inteligencia artificial",
          content: (
            <>
              <p>
                Cuando pedís el análisis de una pieza, procesamos su video: extraemos el audio para
                transcribirlo y analizamos escenas, estructura y mensaje junto con sus métricas. <strong>El
                archivo de video y audio se usa sólo durante el análisis y se borra al terminar.</strong> Guardamos la
                transcripción y el resultado del análisis para que puedas volver a verlo sin
                reprocesarlo.
              </p>
              <p>
                Esos análisis, junto con tus métricas y la información de tu marca, son el contexto que
                usa el Director IA para responderte: puede consultarlos y citarlos en la conversación.
              </p>
              <p>
                Para esto usamos proveedores de modelos de inteligencia artificial —como OpenAI,
                Anthropic o Google— bajo condiciones que <strong>no les permiten usar tus datos para entrenar
                sus modelos</strong> y que limitan su uso a prestarnos el servicio.
              </p>
              <p>
                Los resultados de la IA son orientativos: pueden equivocarse y no reemplazan tu
                criterio. Zenovi no toma decisiones automáticas con efectos legales sobre vos.
              </p>
            </>
          ),
        },
        {
          id: "terceros",
          title: "Con quién los compartimos",
          content: (
            <>
              <p><strong>No vendemos, alquilamos ni licenciamos tus datos a nadie.</strong> Los compartimos sólo con proveedores que necesitamos para prestar el servicio, que actúan bajo nuestras instrucciones:</p>
              <ul>
                <li><strong>Supabase</strong>: base de datos, autenticación y almacenamiento.</li>
                <li><strong>Vercel</strong>: alojamiento y ejecución de la aplicación.</li>
                <li><strong>Proveedores de IA</strong>: transcripción, análisis y respuestas del Director, en las condiciones de la sección anterior.</li>
                <li><strong>Polar</strong>: cobros, facturación e impuestos.</li>
                <li><strong>Google</strong>: inicio de sesión con Google y analítica del sitio.</li>
                <li><strong>Meta</strong>: es la fuente de los datos de Instagram, a través de su API oficial.</li>
              </ul>
              <p>
                Los datos que obtenemos de Instagram sólo se comparten con estos proveedores y para
                prestarte el servicio, nunca con fines publicitarios ni para armar perfiles. También
                podemos compartir datos si lo exige la ley o una autoridad competente.
              </p>
            </>
          ),
        },
        {
          id: "conservacion",
          title: "Cuánto tiempo los guardamos",
          content: (
            <>
              <p>
                Guardamos tus datos mientras tu cuenta esté activa. Los datos de Instagram se
                actualizan con cada sincronización y dejan de guardarse cuando desconectás la cuenta.
              </p>
              <p>
                Cuando pedís el borrado, eliminamos los datos de forma inmediata. Las copias de
                respaldo que puedan contenerlos rotan y desaparecen en un plazo máximo de 30 días.
                Los videos que se procesan para un análisis se borran apenas termina.
              </p>
            </>
          ),
        },
        {
          id: "eliminacion",
          title: "Cómo borrar tus datos",
          content: (
            <>
              <p>Podés borrar tus datos de Instagram de cualquiera de estas formas:</p>
              <ul>
                <li>
                  <strong>Desde Zenovi:</strong> en{" "}
                  <Link href="/settings" className="text-ink underline">Ajustes</Link>, elegí
                  “Desconectar Instagram”. Borramos al instante el perfil, el contenido, las métricas
                  y el acceso a tu cuenta.
                </li>
                <li>
                  <strong>Desde Instagram:</strong> en Configuración → Apps y sitios web, quitá Zenovi.
                  Instagram nos avisa y borramos tus datos automáticamente.
                </li>
                <li>
                  <strong>Por email:</strong> escribinos a{" "}
                  <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a>{" "}
                  pidiendo el borrado de tu cuenta de Zenovi completa.
                </li>
              </ul>
              <p>Tu cuenta de Instagram no se modifica en ningún caso: sólo se borra lo que Zenovi guardaba.</p>
            </>
          ),
        },
        {
          id: "derechos",
          title: "Tus derechos",
          content: (
            <>
              <p>
                De acuerdo con la Ley N.º 18.331 de Protección de Datos Personales de Uruguay, podés
                pedir el acceso, la rectificación, la actualización, la inclusión y la supresión de tus
                datos, escribiéndonos al email de contacto. Respondemos en los plazos que fija la ley.
              </p>
              <p>
                Si considerás que no atendimos tu pedido, podés presentar un reclamo ante la Unidad
                Reguladora y de Control de Datos Personales (URCDP). Si vivís en otro país, puede que
                tengas derechos adicionales según tu legislación.
              </p>
            </>
          ),
        },
        {
          id: "seguridad",
          title: "Seguridad",
          content: (
            <>
              <p>
                Los accesos a Instagram se guardan cifrados y nunca llegan a tu navegador. Cada
                cuenta sólo puede ver sus propios datos, la conexión siempre viaja cifrada y el acceso
                interno está restringido. Ningún sistema es infalible: si detectamos un incidente que
                afecte tus datos, te lo vamos a informar a vos y a las autoridades que corresponda.
              </p>
              <p>
                Si encontrás una vulnerabilidad, escribinos a{" "}
                <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a>.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies y analítica",
          content: (
            <>
              <p>
                Usamos cookies esenciales para mantener tu sesión iniciada: sin ellas Zenovi no
                funciona. También podemos usar <strong>Google Analytics</strong> para entender cómo se usa
                el sitio, con cookies propias de Google, y Google Search Console para medir cómo aparece
                Zenovi en los resultados de búsqueda.
              </p>
              <p>
                Podés bloquear o borrar las cookies desde la configuración de tu navegador, o
                desactivar Google Analytics con el complemento oficial de inhabilitación de Google.
              </p>
            </>
          ),
        },
        {
          id: "transferencias",
          title: "Transferencias internacionales",
          content: (
            <p>
              Algunos de nuestros proveedores guardan o procesan datos fuera de Uruguay, por ejemplo en
              Estados Unidos. En esos casos exigimos condiciones de protección adecuadas y limitamos el
              uso de los datos a prestar el servicio.
            </p>
          ),
        },
        {
          id: "menores",
          title: "Menores de edad",
          content: (
            <p>
              Zenovi está pensado para personas mayores de 18 años. No recopilamos a sabiendas datos de
              menores; si detectamos que una cuenta pertenece a un menor, la eliminamos.
            </p>
          ),
        },
        {
          id: "cambios",
          title: "Cambios en esta política",
          content: (
            <p>
              Si cambiamos esta política, actualizamos la fecha de arriba. Si el cambio es importante,
              te avisamos por email o dentro de Zenovi antes de que empiece a aplicarse.
            </p>
          ),
        },
        {
          id: "contacto",
          title: "Contacto",
          content: (
            <p>
              Por cualquier consulta sobre tus datos, escribinos a{" "}
              <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a> o
              al {LEGAL_CONTACT.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
