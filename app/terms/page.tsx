import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT, LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Términos y condiciones · Zenovi",
  description: "Las condiciones para usar Zenovi: cuentas, planes, créditos, IA y responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos y condiciones"
      intro={
        <p>
          Estos términos regulan el uso de Zenovi. Al crear una cuenta o usar el servicio, aceptás
          estos términos y nuestra{" "}
          <Link href="/privacy" className="text-ink underline">política de privacidad</Link>. Si no estás de
          acuerdo, no uses Zenovi.
        </p>
      }
      sections={[
        {
          id: "quienes",
          title: "Quiénes somos",
          content: (
            <p>
              Zenovi es un proyecto operado por Joaquín Piñeyro, Samuel Romero y Juan Marcos Pimienta,
              personas físicas residentes en Uruguay (en adelante, “Zenovi”, “nosotros”). Contacto:{" "}
              <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a> ·{" "}
              {LEGAL_CONTACT.phone}.
            </p>
          ),
        },
        {
          id: "servicio",
          title: "El servicio",
          content: (
            <p>
              Zenovi es un Director de Marketing con inteligencia artificial. Conecta tu cuenta
              profesional de Instagram, te muestra analíticas de tu cuenta y de tu contenido, analiza
              tus piezas y te ayuda a planificar ideas y guiones. El servicio está en desarrollo
              activo: podemos agregar, cambiar o quitar funciones, y te avisaremos cuando un cambio te
              afecte de forma importante.
            </p>
          ),
        },
        {
          id: "requisitos",
          title: "Requisitos para usar Zenovi",
          content: (
            <ul>
              <li>Tener al menos 18 años.</li>
              <li>Dar información verdadera al crear tu cuenta y mantenerla actualizada.</li>
              <li>Para las funciones de Instagram, tener una cuenta profesional —de empresa o de creador— sobre la que tengas autorización.</li>
            </ul>
          ),
        },
        {
          id: "cuenta",
          title: "Tu cuenta",
          content: (
            <p>
              Sos responsable de mantener seguro el acceso a tu cuenta y de lo que se haga desde ella.
              Si sospechás de un acceso no autorizado, avisanos de inmediato.
            </p>
          ),
        },
        {
          id: "instagram",
          title: "Conexión con Instagram",
          content: (
            <>
              <p>
                Al conectar Instagram, nos autorizás a leer los datos de tu cuenta profesional a través
                de la API oficial de Meta, con los permisos que aceptás en esa pantalla. Zenovi no
                publica, comenta ni envía mensajes en tu nombre.
              </p>
              <p>
                Podés desconectar Instagram cuando quieras desde Ajustes o desde la configuración de
                Instagram; al hacerlo borramos los datos que guardábamos de esa cuenta. Tu uso de
                Instagram sigue sujeto a las condiciones de Meta. Zenovi no está afiliado, patrocinado
                ni respaldado por Meta ni por Instagram.
              </p>
            </>
          ),
        },
        {
          id: "planes",
          title: "Planes, pagos y créditos",
          content: (
            <>
              <p>
                Algunas funciones requieren un plan pago. Los pagos los procesa <strong>Polar</strong>, que
                actúa como revendedor y se encarga del cobro, la facturación y los impuestos; al pagar
                también aceptás sus condiciones.
              </p>
              <ul>
                <li><strong>Renovación:</strong> las suscripciones se renuevan automáticamente al final de cada período hasta que las canceles.</li>
                <li><strong>Cancelación:</strong> podés cancelar en cualquier momento. Mantenés el acceso hasta el final del período ya pagado.</li>
                <li><strong>Reembolsos:</strong> no reembolsamos períodos parciales ni créditos sin usar, salvo que la ley aplicable lo exija. Podemos evaluar casos puntuales. Polar puede emitir reembolsos dentro de los 60 días de la compra para prevenir contracargos.</li>
                <li><strong>Créditos:</strong> cada plan incluye créditos que se consumen al usar funciones de inteligencia artificial. Los créditos no usados vencen al terminar el período y no se acumulan.</li>
                <li><strong>Precios:</strong> podemos cambiar los precios; te avisaremos antes, y el cambio se aplica desde el período siguiente.</li>
              </ul>
            </>
          ),
        },
        {
          id: "uso",
          title: "Uso aceptable",
          content: (
            <>
              <p>No podés usar Zenovi para:</p>
              <ul>
                <li>Conectar cuentas de Instagram sobre las que no tenés autorización.</li>
                <li>Violar la ley, las condiciones de Meta o derechos de terceros.</li>
                <li>Crear contenido engañoso, difamatorio, que incite al odio o que infrinja derechos de autor.</li>
                <li>Intentar acceder a datos de otros usuarios, vulnerar la seguridad del servicio o sobrecargarlo.</li>
                <li>Copiar, revender o reconstruir el servicio, o extraer sus datos de forma automatizada.</li>
              </ul>
            </>
          ),
        },
        {
          id: "contenido",
          title: "Tu contenido",
          content: (
            <p>
              Tu contenido, tus datos y lo que cargás en Zenovi siguen siendo tuyos. Nos das una licencia
              limitada, no exclusiva y revocable para guardarlo, procesarlo y analizarlo con el único
              fin de prestarte el servicio. Esa licencia termina cuando borrás el contenido o tu cuenta.
              Las ideas, guiones y análisis que Zenovi genera para vos son tuyos para usarlos como
              quieras.
            </p>
          ),
        },
        {
          id: "ia",
          title: "Resultados de la inteligencia artificial",
          content: (
            <p>
              Los análisis, recomendaciones, ideas y guiones de Zenovi se generan con inteligencia
              artificial. Son orientativos, pueden contener errores y no garantizan ningún resultado de
              alcance, ventas ni crecimiento. Revisalos antes de usarlos: las decisiones sobre tu
              contenido y tu negocio son tuyas.
            </p>
          ),
        },
        {
          id: "propiedad",
          title: "Propiedad de Zenovi",
          content: (
            <p>
              El software, el diseño, la marca y los materiales de Zenovi nos pertenecen y están
              protegidos por las leyes de propiedad intelectual. Estos términos no te dan ningún derecho
              sobre ellos más allá de usar el servicio.
            </p>
          ),
        },
        {
          id: "suspension",
          title: "Suspensión y cancelación",
          content: (
            <p>
              Podés dejar de usar Zenovi y pedir el borrado de tu cuenta cuando quieras. Podemos
              suspender o cerrar una cuenta que incumpla estos términos o ponga en riesgo el servicio o
              a otros usuarios; salvo casos graves, te avisaremos antes.
            </p>
          ),
        },
        {
          id: "garantias",
          title: "Exclusión de garantías",
          content: (
            <p>
              Zenovi se ofrece “tal cual” y “según disponibilidad”. Hacemos lo posible para que funcione
              bien, pero no garantizamos que esté libre de errores o interrupciones. Los datos de
              Instagram dependen de Meta, que puede demorarlos, limitarlos o cambiarlos sin aviso.
            </p>
          ),
        },
        {
          id: "responsabilidad",
          title: "Limitación de responsabilidad",
          content: (
            <p>
              En la medida en que la ley lo permita, Zenovi no responde por daños indirectos, lucro
              cesante ni pérdida de datos o de oportunidades de negocio derivados del uso del servicio.
              En todo caso, nuestra responsabilidad total se limita al monto que pagaste por Zenovi en los
              12 meses anteriores al reclamo.
            </p>
          ),
        },
        {
          id: "cambios",
          title: "Cambios en estos términos",
          content: (
            <p>
              Podemos actualizar estos términos. Si el cambio es importante, te avisamos por email o
              dentro de Zenovi antes de que empiece a aplicarse. Seguir usando el servicio después de ese
              aviso implica que aceptás los términos nuevos.
            </p>
          ),
        },
        {
          id: "ley",
          title: "Ley aplicable",
          content: (
            <p>
              Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier
              controversia se someterá a los tribunales competentes de la ciudad de Montevideo, sin
              perjuicio de los derechos que te reconozca la ley de tu país como consumidor.
            </p>
          ),
        },
        {
          id: "contacto",
          title: "Contacto",
          content: (
            <p>
              Por cualquier consulta sobre estos términos, escribinos a{" "}
              <a href={`mailto:${LEGAL_CONTACT.email}`} className="text-ink underline">{LEGAL_CONTACT.email}</a> o
              al {LEGAL_CONTACT.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
