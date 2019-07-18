import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Link from 'src/shared/Link'
import Responsive from 'src/shared/Responsive'
import { TextStyles } from 'src/shared/Styles'
import { ResponsiveH1 } from 'src/shared/Text'

export default class ArgentinaPrivacy extends React.Component {
  render() {
    return (
      <View>
        <Head>
          <title>Celo - Argentina Privacy Policy</title>
          <meta
            name="description"
            content="This page informs you about our Privacy Policy for the pilot project in Argentina"
          />
        </Head>

        <View style={styles.container}>
          <View style={styles.maxWidth}>
            <View style={styles.headerBox}>
              <ResponsiveH1 style={styles.header}>Política de Privacidad</ResponsiveH1>
            </View>
            <View style={styles.communityBox}>
              <Responsive>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>1.1. </Text>
                  La presente Política de Privacidad (en adelante la “Política de Privacidad”) se
                  aplica a la utilización de la aplicación para teléfonos móviles publicada en la
                  URL:{' '}
                  <Link
                    href={'/arg_tos'}
                  >{`https:/play.google.com/store/apps/details?id=org.celo.mobile`}</Link>{' '}
                  (en adelante, la “Solución”), provistas por CELO en adelante, “LA EMPRESA”, cuya
                  función principal consiste en brindar un servicio a los Usuarios a fin de ofrecer
                  a modo de prueba limitada los productos de LA EMPRESA, que incluyen la Celo Wallet
                  (“Billetera De Celo”) a través de la cual LA EMPRESA mapea números telefónicos a
                  las direcciones wallet usando un innovador algoritmo criptográfico descentralizado
                  y Celo Rewards (“Recompensas Celo”) Es decir, LA EMPRESA se encarga de eliminar
                  las barreras para la adopción de criptomonedas a gran escala como medio de pago.
                  En caso de ser necesario, LA EMPRESA podrá complementar la Política de Privacidad
                  con información y/o términos y condiciones específicos con relación al Servicio.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  La aceptación de la invitación a la prueba y el registro en la Solución atribuye
                  la condición de usuario de LA EMPRESA (en adelante el “Usuario” o los “Usuarios”)
                  y expresa la aceptación plena y sin reservas de todas y cada una de las cláusulas
                  de la Política de Privacidad en la versión publicada por LA EMPRESA en el momento
                  mismo en que el Usuario acceda al Sitio o utilice su Servicio. En consecuencia, la
                  Política de Privacidad constituirá un acuerdo válido y obligatorio entre el
                  Usuario y LA EMPRESA con relación a la privacidad. Asimismo, la utilización del
                  Servicio expresa la aceptación plena y sin reservas del Usuario de los Términos y
                  Condiciones de utilización del Servicio (en adelante, los “Términos y
                  Condiciones”) publicados por LA EMPRESA en{' '}
                  <Link href={'/arg_tos'}>{`https://celo.org/arg_tos`}</Link>, que se complementan
                  con la Política de Privacidad.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  LA EMPRESA podrá modificar la Política de Privacidad en cualquier momento. Las
                  nuevas versiones de la Política de Privacidad serán notificadas mediante
                  publicación de dicha nueva versión en{' '}
                  <Link href={'/arg_privacy'}>{`https://celo.org/arg_privacy`}</Link> y notificada
                  por las vías de contacto que el Usuario declare en su caso.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  El Usuario acepta que será dado por notificado de cualquier modificación a la
                  Política de Privacidad una vez que LA EMPRESA hubiera publicado las mismas en{' '}
                  <Link href={'/arg_privacy'}>{`https://celo.org/arg_privacy`}</Link>, y que la
                  continuación del Usuario en el uso del Servicio una vez publicada dicha nueva
                  versión se considerará como aceptación de dichas modificaciones a la Política de
                  Privacidad. En consecuencia, el Usuario acepta chequear{' '}
                  <Link href={'/arg_privacy'}>{`https://celo.org/arg_privacy`}</Link>{' '}
                  periódicamente.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  Para LA EMPRESA la privacidad de los datos personales es muy importante.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  Si tiene dudas con respecto a la Política de Privacidad, por favor escribanos a{' '}
                  <Link href={'mailto:datos@celo.org'}>datos@celo.org</Link>.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  2. Recolección de Informacón de los Usarios. Fines.{' '}
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>2.1. </Text>
                  Los Usuarios aceptan que LA EMPRESA pueda recolectar información acerca de sus
                  Usuarios utilizando cookies, tags y otros métodos (tales como la información
                  proporcionada por los Usuarios al efectuar una compra).
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>2.2. </Text>
                  Asimismo, LA EMPRESA puede recopilar y/o almacenar el número o dirección de IP
                  (Internet Protocol) de los Usuarios a los fines de mejorar la calidad del Servicio
                  que brinda a través de la Solución. El almacenamiento por parte de LA EMPRESA del
                  número de IP de los dispositivos de los Usuarios permite identificarlos al momento
                  de su ingreso a sus cuentas individuales. Asimismo facilita el diagnóstico de los
                  eventuales problemas de conexión que puedan llegar a existir entre la Solución de
                  LA EMPRESA y los Usuarios, mejorando la calidad de los Servicios.
                  {'\n'}
                  El número o dirección de IP (Internet Protocol) es una identificación numérica que
                  distingue a un dispositivo electrónico informático (sea este una computadora, un
                  teléfono personal con acceso a redes, una tableta, una PDA, etc.) que se conecta a
                  una red informática (por ejemplo Internet).
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>2.3. </Text>
                  LA EMPRESA podrá solicitar al Usuario y almacenar su datos personales, y de
                  facturación: (i) nombre y apellido; (ii) teléfono; (iii) DNI; (iv) correo
                  electrónico; (v) dirección; (vi) código postal; (vii) ciudad; (viii) región; (ix)
                  país de residencia (en adelante, los “Datos”). La recolección de información
                  permite ofrecer al Usuario un Servicio personalizado, que se adecue a sus
                  necesidades para brindar la mejor experiencia posible con LA EMPRESA.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>2.4. </Text>
                  LA EMPRESA podrá almacenar o recopilar la información y datos de los Usuarios como
                  cuentas bancarias, información de carácter fiscal, números y nombres de
                  identificación bancaria y tributaria, números de tarjeta de crédito y/o débito.
                  Dicha información podrá ser almacenada en los servidores de LA EMPRESA, pudiendo
                  LA EMPRESA tener acceso a la misma.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  3. Uso de la Informacón de los Usarios Recolectada{' '}
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.1. </Text>
                  LA EMPRESA podrá recolectar información de los Usuarios utilizando cookies y/o
                  tags o cualquier otro método de detección de información automatizada provisto por
                  las herramientas que ofrecen en la Solución. La información que recopile LA
                  EMPRESA podrá incluir el comportamiento de navegación, dirección IP, logs, y otros
                  tipos de información. Sin embargo, LA EMPRESA no recolectará información personal
                  identificable de manera directa de ningún Usuario usando cookies o tags o
                  cualquier otro método de detección de información automatizada provisto por las
                  herramientas que ofrece la Solución.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.2. </Text>
                  LA EMPRESA utilizará y almacenará la información provista por los Usuarios y la
                  recolectada por LA EMPRESA con el fin de proveer el Servicio y sus mejoras a los
                  Usuarios, intentando ajustarse a sus necesidades, por el plazo máximo que
                  establezca la Ley 25.326.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.3. </Text>
                  LA EMPRESA utilizará la información provista por los Usuarios y la recolectada por
                  LA EMPRESA con el fin de analizarla y mejorar sus productos y servicios. Bajo esa
                  finalidad, LA EMRPESA, podrá enviar a sus Usuarios, notificaciones, noticias y
                  novedades de su interés, además de aquellas que revistan el carácter de
                  notificaciones de índole institucional o legal.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.4. </Text>
                  LA EMPRESA utilizará la información provista por los Usuarios y la recolectada por
                  LA EMPRESA para analizar las conductas y comportamientos de los Usuarios en
                  carácter de tales, en su Sitio, como sus ubicaciones geográficas, sus sesiones de
                  uso, permanencia en la Solución, frecuencia de uso, a los efectos de intentar
                  mejorar su Servicio e intentar proveerlos de mejores soluciones a sus necesidades.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.5. </Text>
                  LA EMPRESA podrá compartir la información con otras empresas de servicios o sitios
                  de internet o similares a los fines de mejorar la calidad del Servicio de LA
                  EMPRESA. Generalmente dichas empresas o sitios de internet poseen sus propias
                  políticas de privacidad de datos a los fines de su protección. De todas maneras LA
                  EMPRESA empeñará sus mejores esfuerzos en que la privacidad de la información
                  compartida sea protegida de la mejor manera posible. En los casos que corresponda
                  LA EMPRESA intentará firmar acuerdos expresos en materia de protección de datos y
                  de privacidad de la información. Sin perjuicio de ello, LA EMPRESA no será
                  responsable por los daños provocados por tales empresas y/o sitios de internet en
                  cuanto a su deber de protección, confidencialidad y privacidad de los datos que
                  ellas manejan.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.6. </Text>
                  LA EMPRESA utilizará la información provista por los Usuarios y la recolectada por
                  LA EMPRESA en caso de ser solicitada por tribunales, u organismos estatales
                  nacionales o internacionales que así lo requieran y lo soliciten en la forma
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>3.7. </Text>
                  LA EMPRESA no estará obligado a retener la información durante ningún plazo
                  establecido y dispondrá la eliminación de la misma cuando lo juzgue conveniente.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>4. La Solucion</Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>4.1. </Text>
                  LA EMPRESA no venderá, alquilará ni negociará ningún Dato a ningún tercero para
                  fines comerciales. Cualquier persona que hubiera provisto información de contacto
                  personal a través de la Solución de LA EMPRESA, podrá enviar un correo electrónico
                  a datos@celo.org a fin de actualizar, borrar y/o corregir su información personal
                  de contacto. LA EMPRESA responderá dicho requerimiento dentro de los 30 (treinta)
                  días siguientes a la recepción del mismo vía correo electrónico.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>4.2. </Text>
                  La Solución de LA EMPRESA podrá utilizar cookies para registrar patrones de
                  Usuarios. En caso que un Usuario de la Solución no desee aceptar estas cookies,
                  podrá configurar su navegador para que le otorgue la opción de aceptar cada cookie
                  y rechazar las que no desee. La Solución también podrán utilizar herramientas de
                  análisis de los cookies, log files y tags.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>4.3. </Text>
                  La Solución de LA EMPRESA podrá contener enlaces a otros sitios de internet que no
                  sean propiedad de LA EMPRESA. En consecuencia, LA EMPRESA no será responsable por
                  el actuar de dichos sitios de internet, a los cuales no se aplicará la presente
                  Política de Privacidad. Recomendamos examinar la política de privacidad detallada
                  en aquellos sitios de internet para entender los procedimientos de recolección de
                  información que utilizan y como protegen sus datos personales.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>4.4. </Text>
                  Las disposiciones de la Política de Privacidad se aplicarán a todos los Usuarios
                  de LA EMPRESA, hayan estos ingresado sus Datos o no.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>5. Menores de Edad</Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>5.1. </Text>
                  Si bien la Solución y/o Servicio no están dirigidos a menores de edad, en caso en
                  que algún menor tenga acceso a los mismos, su uso deberá ser supervisado por los
                  padres, madres, tutores o responsables legales. La Solución y/o Servicio están
                  permitidos sólo para quienes tengan edad legal para contratar y no se encuentren
                  inhibidos legalmente o de algún modo vedados de ejercer actos jurídicos, derechos
                  y/u obligaciones. Habida cuenta de ello, los menores de 18 años no tienen
                  permitido el ingreso al Sitio y/o Servicio, así como tampoco suministrar ningún
                  Dato ni ningún otro tipo de información.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>5.2. </Text>
                  Asimismo, toda vez que los menores de edad pueden no alcanzar a comprender
                  debidamente la Política de Privacidad y sus implicancias, ni decidir válidamente
                  sobre las opciones disponibles a través de sus Servicios, LA EMPRESA insta a todos
                  los padres o representantes, tutores o adultos bajo cuya supervisión se encuentren
                  los menores que accedan al Servicio de LA EMPRESA, a participar activa y
                  cuidadosamente en las actividades que el menor realice en internet o través de la
                  Solución, al Servicio on-line que utilicen dichos menores, a la información a la
                  que estos accedan, ya sea cuando dichos menores visiten la Solución de LA EMPRESA
                  o cualquier otro sitio de terceros, a enseñarles y a guiarlos en cómo proteger su
                  propia información personal mientras estén navegando en internet.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  6. Confidencialidad y Seguridad de la Informacón
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>6.1. </Text>
                  LA EMPRESA ha adoptado medidas de seguridad razonables para proteger la
                  información de los Usuarios e impedir el acceso no autorizado a sus datos o
                  cualquier modificación, divulgación o destrucción no autorizada de los mismos. La
                  información recolectada por LA EMPRESA, será mantenida de manera estrictamente
                  confidencial. El acceso a los datos personales está restringido a aquellos
                  empleados, contratistas, operadores, y representantes de LA EMPRESA que necesitan
                  conocer tales datos para desempeñar sus funciones y desarrollar o mejorar nuestro
                  Servicio. LA EMPRESA exige a sus proveedores los mismos estándares de
                  confidencialidad. LA EMPRESA no permite el acceso a esta información a terceros
                  ajenos a LA EMPRESA, a excepción de un pedido expreso del Usuario.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>6.2. </Text>
                  Sin perjuicio de lo expuesto, considerando que internet es un sistema abierto, de
                  acceso público, LA EMPRESA no puede garantizar que terceros no autorizados no
                  puedan eventualmente superar las medidas de seguridad y utilizar la información de
                  los Usuarios en forma indebida.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  7. Cambios en la Estructura Corporativa
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>7.1. </Text>
                  LA EMPRESA se reserva el derecho de transferir la información recolectada en caso
                  de venta o fusión de LA EMPRESA, o de una adquisición de los activos principales
                  de LA EMPRESA, o cualquier otra clase de transferencia de LA EMPRESA a otra
                  entidad. En dicho supuesto, LA EMPRESA deberá adoptar las medidas razonables a
                  efectos de asegurar que dicha información sea utilizada de una manera consistente
                  con la Política de Privacidad.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  8. Derechos de los Usarios sobre la Informacón
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>8.1. </Text>
                  La mayoría de los navegadores están configurados para aceptar cookies, pero los
                  Usuarios podrán reconfigurar su navegador de internet para rechazar todas las
                  cookies o para que el sistema le indique en qué momento se envía una. Sin embargo,
                  si las cookies están inhabilitadas, es posible que algunas características y
                  servicios de la Solución no funcionen de manera adecuada.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>8.1. </Text>
                  LA EMPRESA tratará, por todos los medios a su alcance, de facilitar a los Usuarios
                  sobre los cuales haya recopilado o almacenado información personal, el acceso a
                  sus Datos (“Derecho de Acceso”), así como la rectificación, modificación o
                  actualización de los mismos (“Derecho de Rectificación”), o incluso la cancelación
                  de dichos datos personales (“Derecho de Remoción”), a menos que LA EMPRESA pueda
                  denegar dichas solicitudes (en adelante, las “Solicitudes”), en caso que se
                  encuentre obligada o tenga derecho a conservar dichos Datos de acuerdo a la
                  legislación aplicable.
                </Text>
                <Text style={styles.nestedItem}>
                  a) A dichos efectos, el Usuario deberá enviar su Solicitud mediante el envío de un
                  correo electrónico con el asunto “Acceso a Datos Personales” a datos@celo.org. LA
                  EMPRESA podrá requerir a dicho Usuario que se identifique, lo que podrá ser
                  verificado por LA EMPRESA, así como que precise los Datos a los cuales se desea
                  acceder, rectificar o remover.
                </Text>
                <Text style={styles.nestedItem}>
                  b) LA EMPRESA podrá rechazar la tramitación de Solicitudes que sean
                  irrazonablemente repetitivas o sistemáticas, que requieran un esfuerzo técnico
                  desproporcionado, que pongan en peligro la privacidad de los demás Usuarios, o que
                  se consideren poco prácticas, o para las que no sea necesario acceder a los Datos.
                </Text>
                <Text style={styles.nestedItem}>
                  c) El servicio de acceso, rectificación y remoción de Datos será prestado por LA
                  EMPRESA en forma gratuita, excepto en caso que requiriera un esfuerzo
                  desproporcionado o irrazonable, en cuyo caso podrá cobrarse un cargo de
                  administración.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  9. EL TITULAR DE LOS DATOS PERSONALES TIENE LA FACULTAD DE EJERCER EL DERECHO DE
                  ACCESO A LOS MISMOS EN FORMA GRATUITA A INTERVALOS NO INFERIORES A SEIS MESES,
                  SALVO QUE SE ACREDITE UN INTERÉS LEGÍTIMO AL EFECTO CONFORME LO ESTABLECIDO EN EL
                  ARTÍCULO 14, INCISO 3 DE LA LEY Nº 25.326 DE LA REPUBLICA ARGENTINA. LA AUTORIDAD
                  DE APLICACIÓN (EN ARGENTINA, LA AGENCIA DE ACCESO A LA INFORMACIÓN PUBLICA, ÓRGANO
                  DE CONTROL DE LA LEY Nº 25.326), TIENE LA ATRIBUCIÓN DE ATENDER LAS DENUNCIAS Y
                  RECLAMOS QUE SE INTERPONGAN CON RELACIÓN AL INCUMPLIMIENTO DE LAS NORMAS SOBRE
                  PROTECCIÓN DE DATOS PERSONALES.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  {`Para contactar a la Agencia de Acceso a la Información Pública:\nAv. Pte. Julio A. Roca 710, Piso 2º - Ciudad de Buenos Aires www.argentina.gob.ar/aaip\ndatospersonales@aaip.gob.ar\nTel. +5411-2821-0047`}
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>10. Excepciones</Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>10.1. </Text>
                  No obstante cualquier otra provisión en contrario en la Política de Privacidad, LA
                  EMPRESA podrá divulgar cierta información personal de los Usuarios, cuando crea de
                  buena fe que esa divulgación resulte razonablemente necesaria para:
                </Text>
                <Text style={styles.nestedItem}>a) evitar una responsabilidad legal;</Text>
                <Text style={styles.nestedItem}>
                  b) cumplir una exigencia legal, tal como una orden de allanamiento, una citación o
                  una orden judicial;
                </Text>
                <Text style={styles.nestedItem}>
                  c) cumplir un requerimiento de una autoridad gubernamental o reguladora; y/o
                </Text>
                <Text style={styles.nestedItem}>
                  d) proteger los derechos, propiedad o seguridad de LA EMPRESA, de los Usuarios, o
                  de un tercero.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  11. Servicios de Terceros
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>11.1. </Text>
                  LA EMPRESA podrá utilizar y utiliza servicios de terceros, de los que no resulta
                  responsable por la información que recolectan ni la forma en que protegen su
                  información personal. Para ello, cada uno de estos servicios de terceros cuentan
                  con sus propias políticas de privacidad y proveen, en los casos que se encuentre
                  disponible, un método con el que Usuario podrá hacer un opt-out.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  12. Cambios en la Política de Privacidad
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>12.1. </Text>
                  LA EMPRESA podrá modificar la presente Política de Privacidad en caso que lo
                  considere oportuno. En caso que las modificaciones sean sustanciales con relación
                  al tratamiento de los Datos recolectados en virtud de la utilización de los
                  Servicios, las mismas serán notificadas mediante la publicación de un aviso
                  destacado en la Solución y con el envío de un correo electrónico a la dirección
                  declarada por el Usuario.
                </Text>

                <Text style={[TextStyles.semibold16, styles.subtitle]}>13. Contacto</Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  <Text style={[TextStyles.semibold16, styles.subtitle]}>13.1. </Text>
                  En caso que el Usuario tenga alguna duda acerca de la Política de Privacidad, o
                  sobre la aplicación de la misma, deberá ponerse en contacto con LA EMPRESA, en
                  cualquier momento, vía correo electrónico a datos@celo.org.
                </Text>
              </Responsive>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

// @ts-ignore
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 80,
  },
  maxWidth: {
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    maxWidth: 854,
  },
  communityBox: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
    marginBottom: 20,
    marginTop: 20,
  },
  headerBox: {
    alignSelf: 'stretch',
  },
  header: {
    alignSelf: 'stretch',
    marginTop: 127,
    marginBottom: 21,
  },
  subtitle: {
    marginTop: 20,
    marginBottom: 5,
  },
  introItem: {
    paddingVertical: 10,
  },
  nestedItem: {
    paddingBottom: 5,
    marginLeft: 20,
  },
})
