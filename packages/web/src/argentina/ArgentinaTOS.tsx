import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Link from 'src/shared/Link'
import Responsive from 'src/shared/Responsive'
import { TextStyles } from 'src/shared/Styles'
import { ResponsiveH1 } from 'src/shared/Text'

export default class ArgentinaTOS extends React.Component {
  render() {
    return (
      <View>
        <Head>
          <title>Celo - Argentina Terms of Service</title>
          <meta
            name="description"
            content="This page informs you about our Terms OF Service for the pilot project in Argentina"
          />
        </Head>

        <View style={styles.container}>
          <View style={styles.maxWidth}>
            <View style={styles.headerBox}>
              <ResponsiveH1 style={styles.header}>
                Condiciones de la prueba y acuerdo del usuario
              </ResponsiveH1>
            </View>
            <View style={styles.communityBox}>
              <Responsive>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  Válido a partir del 26 de noviembre de 2018{' '}
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  Los presentes términos y condiciones de prueba del servicio regulan la relación
                  contractual entre los usuarios (en adelante “Usuarios”), con Celo Labs Inc., con
                  domicilio legal en Estados Unidos (en adelante la “EMPRESA” y junto con los
                  Usuarios, las “Partes”). Los Usuarios se encontrarán sujetos a los Términos y
                  Condiciones de la Prueba respectivos, junto con todas las demás políticas y
                  principios que rige la EMPRESA y que son incorporados al presente por referencia.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  CUALQUIER PERSONA QUE NO ACEPTE ESTOS TÉRMINOS Y CONDICIONES GENERALES, LOS CUALES
                  TIENEN UN CARÁCTER OBLIGATORIO Y VINCULANTE, DEBERÁ ABSTENERSE DE UTILIZAR EL
                  SERVICIO.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  El Usuario debe leer, entender y aceptar todas las condiciones establecidas en los
                  Términos y Condiciones y en las Políticas de Privacidad.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  LA EMPRESA podrá modificar los presentes Términos y Condiciones en cualquier
                  momento. Las nuevas versiones de los Términos y Condiciones serán notificadas
                  mediante publicación de dicha nueva versión en el Sitio y notificada por las vías
                  de contacto que el Usuario declare en su caso.
                </Text>
                <Text style={[TextStyles.smallMain, styles.introItem]}>
                  LA EMPRESA provee una plataforma (en adelante el “Sitio”) con el fin de ofrecer a
                  modo de prueba limitada los productos de LA EMPRESA, que incluyen la Celo Wallet
                  (“Billetera De Celo”) a través de la cual LA EMPRESA mapea números telefónicos a
                  las direcciones wallet usando un innovador algoritmo criptográfico descentralizado
                  y Celo Rewards (“Recompensas Celo”). Los Servicios se le brindan al Usuario con
                  sujeción al presente Acuerdo, así como a la Política de Privacidad, disponible en
                  e incorporada a los presentes Términos y Condiciones.
                </Text>

                {/* Terms 1 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  1. Cláusula Primera: Registro
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>1.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Para el acceso a la prueba de los contenidos y Servicios del Sitio el Usuario
                    debe recibir una invitación por parte de la EMPRESA a través de correo
                    electrónico a fin de que se registre en el siguiente sitio web bajo URL:{' '}
                    <Link
                      href={'/arg_tos'}
                    >{`https:/play.google.com/store/apps/details?id=org.celo.mobile`}</Link>{' '}
                    (en adelante, el “Formulario de Registro”). El Usuario deberá completar todos
                    los campos de registro con datos válidos y verificar que la información que pone
                    a disposición de LA EMPRESA sea exacta, precisa y verdadera (en adelante, los
                    "Datos Personales"). LA EMPRESA podrá utilizar diversos medios para identificar
                    a los Usuarios, pero LA EMPRESA no se responsabiliza por la certeza de los Datos
                    Personales que sus Usuarios pongan a su disposición. Los Usuarios garantizan y
                    responden, en cualquier caso, de la veracidad, exactitud, vigencia y
                    autenticidad de los Datos Personales puestos a disposición de LA EMPRESA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>1.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario acepta que solo habrá una inscripción por Usuario. El Usuario deberá
                    proporcionar información precisa según lo requerido por LA EMPRESA. El Usuario
                    no podrá tener más accesos que los indicados, ya sea mediante varias direcciones
                    de correo electrónico, números de teléfono, identidades, ni dispositivos en un
                    intento de eludir las disposiciones de los presentes Términos y Condiciones. En
                    caso de que el Usuario utilice métodos fraudulentos o intente de otra manera
                    burlar las normas, su participación puede ser descalificada, a criterio
                    exclusivo de LA EMPRESA. El Usuario acepta atenerse a todas las leyes aplicables
                    en virtud del uso de los Servicios y Productos de LA EMPRESA. Mediante su
                    participación, el Usuario acepta que LA EMPRESA utilice toda información y datos
                    necesarios (entre otros, sus interacciones con los Servicios y Productos de LA
                    EMPRESA, transacciones y mensajes) para la mejora de sus productos y servicios.
                    Además, el Usuario acepta y reconoce que LA EMPRESA puede compartir dicha
                    información de forma anonimizada a terceros.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>1.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    A los efectos de adquirir la condición de Usuario de LA EMPRESA, el Usuario
                    deberá completar el Formulario de Registro, ser mayor a 18 años de edad, ser
                    residente Argentino, aceptar la Política de Privacidad, y los presentes Términos
                    y Condiciones.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>1.4. </Text>
                  <Text style={TextStyles.semibold16}>
                    LA EMPRESA se reserva el derecho de solicitar algún comprobante y/o dato
                    adicional a efectos{' '}
                  </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    de corroborar los Datos Personales, y de suspender el/los Servicio/s, a aquel
                    Usuario cuyos datos no hayan podido ser confirmados. LA EMPRESA no se
                    responsabiliza por la certeza de los datos consignados en el Formulario de
                    Registro. Los Datos Personales que el Usuario proporcione se integrarán en una
                    base de datos personales de la que es responsable LA EMPRESA. Para más
                    información consultar la Política de Privacidad.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>1.5. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Queda prohibido que un competidor acceda a los Servicios prestados por LA
                    EMPRESA, salvo consentimiento previo de LA EMPRESA. También queda prohibido
                    acceder a los Servicios, prestados por LA EMPRESA con el fin de monitorear su
                    desempeño o funcionalidad, publicándolos o haciéndolos accesibles a cualquier
                    competidor o tercero no regido por estos términos y condiciones, o para
                    cualquier otro punto de referencia o propósitos competitivos.
                  </Text>
                </Text>

                {/* Terms 2 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  2. Cláusula Segunda: Condiciones Generales de la Prueba de Celo
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>2.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Los productos y Servicios de LA EMPRESA serán suministrados al Usuario durante
                    un tiempo limitado como parte de una prueba (“Prueba de Celo”) a fin de que LA
                    EMPRESA obtenga una mejor comprensión respecto de la interacción entre los
                    Usuarios y las nuevas tecnologías destinadas a ofrecer diversos medios de pago,
                    o entre Usuarios que se encuentren dentro del ecosistema de LA EMPRESA. El
                    Usuario debe entender que su participación en la Prueba de Celo es completamente
                    voluntaria. No obstante, en caso de formar parte de la Prueba de Celo, el
                    Usuario debe cumplir estrictamente los presentes términos y condiciones.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>2.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA se reserva el derecho a bloquear el acceso al Usuario (así sea
                    parcial o total) a los productos y Servicios de LA EMPRESA, y a retener o no
                    efectuar el Pago conforme se establece en la Cláusula 3, en el caso de que el
                    Usuario infrinja cualquier disposición establecida en los presentes Términos y
                    Condiciones, a discreción exclusiva de LA EMPRESA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  EL USUARIO RECONOCE QUE CUALQUIER VULNERACIÓN DE ESTOS TÉRMINOS Y CONDICIONES, A
                  CRITERIO EXCLUSIVO DE LA EMPRESA, TENDRÁ COMO RESULTADO SU DESCALIFICACIÓN EN
                  RELACIÓN CON LA PRUEBA DE CELO, ASÍ COMO LA FINALIZACIÓN O INHABILITACIÓN DE TODOS
                  LOS PRIVILEGIOS, INCLUIDOS LOS PAGOS.
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>2.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario comprende que participa de una prueba, y que los Servicios
                    proporcionados al Usuario como parte de la Prueba de Celo no constituyen
                    referencias ni declaraciones de divisas, monedas fiduciarias, criptomonedas u
                    otras unidades de valor.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>2.4. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Al participar en la Prueba de Celo, el Usuario acepta someterse total e
                    incondicionalmente a los presentes Términos y Condiciones, y declara y garantiza
                    que cumple todos los requisitos. Además, comprende y acepta que las decisiones
                    de LA EMPRESA serán finales y vinculantes en la medida que se relacionen con los
                    presentes Términos y Condiciones. El Usuario reconoce y acepta que el uso de los
                    Servicios y productos de LA EMPRESA solo se realizan a los fines de la prueba y
                    que el Usuario no recibirá dinero de ninguna forma.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>2.5. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    En el supuesto de encontrarse calificado para efectuar la Prueba de Celo, el
                    Usuario podrá participar en la misma desde el 26 de noviembre de 2018 a las
                    12:00 a. m., hora de la Argentina (ART), hasta la fecha tope del 31 de mayo de
                    2019 a las 11:59 p. m., hora de la Argentina (ART) (en adelante, el “Período de
                    Prueba”). El Usuario deberá participar de la Prueba de Celo y utilizar el
                    Servicio de forma activa durante todo el Período de Prueba. Al final de la
                    Prueba de Celo y, a menos que LA EMPRESA lo autorice específicamente por
                    escrito, el Usuario acepta que LA EMPRESA procederá a interrumpir todo uso de
                    los Servicios.
                  </Text>
                </Text>

                {/* Terms 3 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  3. Cláusula Tercera: Condiciones Económicas
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>3.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Como consecuencia por el uso activo de los Servicios durante el Período de
                    Prueba, LA EMPRESA abonará al Usuario un monto total de hasta USD 50 (Dólares
                    Norteamericanos Cincuenta) o su equivalente en Pesos Argentinos, bajo el tipo de
                    cambio determinado por el Banco Central de la República Argentina el día en que
                    se realizará el pago. (en adelante, el “Pago”)
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  Para ello, el Usuario deberá atenerse a las leyes aplicables, según corresponda, y
                  brindar toda la documentación necesaria a la EMPRESA. El Pago no será
                  transferible. Todos los gastos relacionados con el Pago, como, por ejemplo, los
                  impuestos pertinentes, serán de la exclusiva responsabilidad del Usuario. La
                  recepción del Pago por su parte queda condicionada al cumplimiento de todas las
                  normas, leyes y disposiciones. El Pago se realizará en efectivo. Si el Pago no se
                  encontrare disponible por alguna razón, LA EMPRESA, a su exclusivo criterio, puede
                  reemplazarlo con algo de valor semejante o equivalente.
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  CUALQUIER VULNERACIÓN DE ESTOS TÉRMINOS Y CONDICIONES (SEGÚN SE DETERMINE A
                  CRITERIO EXCLUSIVO DE LA EMPRESA), TENDRÁ COMO RESULTADO LA PÉRDIDA DE TODO TIPO
                  DE PAGO Y LA FINALIZACIÓN INMEDIATA DE TODOS LOS PRIVILEGIOS.
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>3.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    En caso de que el Usuario, no acepte el Pago dentro de los siete (7) días desde
                    ofrecido el mismo, LA EMPRESA no abonará el mismo y aquel se perderá sin que
                    ello genere derecho a reclamo alguno por parte del Usuario. La aceptación del
                    Pago constituye la autorización para que LA EMPRESA use su nombre e imagen, con
                    fines de publicidad y comercialización sin mayor compensación que la mencionada,
                    a menos que lo prohíba la Ley. LA EMPRESA puede utilizar, reproducir, editar,
                    mostrar, transmitir, modificar, publicar, así como preparar obras derivadas, y
                    de otro modo hacer uso de su nombre e imagen en todos los medios, ya sean
                    conocidos en la actualidad o que se creen en adelante —en todo el mundo y con
                    cualquier fin— sin compensación a usted de ningún tipo.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>3.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    En el supuesto que la participación del Usuario sea incompleta o no se atenga a
                    las reglas o especificaciones de los presentes Términos y Condiciones, el
                    Usuario puede considerarse descalificado a criterio exclusivo de LA EMPRESA y
                    como consecuencia de ello, no percibirá el Pago.
                  </Text>
                </Text>

                {/* Terms 4 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  4. Cláusula Cuarta: Uso del Sitio
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA no será responsable si el Usuario no cuenta con un medio de
                    comunicación o tecnológico compatible con el uso del Sitio para el acceso a la
                    información.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario se compromete a hacer un uso adecuado y lícito del Sitio de
                    conformidad con la legislación aplicable, los presentes Términos y Condiciones,
                    la moral y buenas costumbres generalmente aceptadas y al orden público.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Al utilizar el Sitio o los Servicios, el Usuario acuerda que:
                  </Text>
                </Text>
                <View style={styles.subitem}>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    a. No solicitará el Servicio con fines ilícitos, ilegales, contrarios a lo
                    establecido en los presentes Términos y Condiciones, a la buena fe y al orden
                    público, lesivos de los derechos e intereses de terceros.
                  </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    b. No tratará de dañar el Servicio o el Sitio de ningún modo, ni accederá a
                    recursos restringidos en el Sitio.
                  </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    c. No utilizará el Servicio o el Sitio con un dispositivo incompatible o no
                    autorizado.
                  </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    d. No introducirá ni difundirá virus informáticos o cualesquiera otros sistemas
                    físicos o lógicos que sean susceptibles de provocar daños en el Sitio.
                  </Text>
                </View>

                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.4. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA se reserva el derecho, a su exclusivo criterio, de cancelar,
                    finalizar, modificar o suspender la Prueba de Celo en caso de que un virus, un
                    error, una intervención humana no autorizada, un fraude u otra causa más allá
                    del control de LA EMPRESA corrompa o afecte la administración, la seguridad, la
                    imparcialidad o la conducta apropiada de la Prueba de Celo. En ese caso, LA
                    EMPRESA puede decidir adjudicar el Pago o abstenerse de ello, sin que ello
                    genere derecho a reclamo alguno por parte del Usuario. LA EMPRESA se reserva el
                    derecho, a su exclusivo criterio, de descalificar a todo Usuario que manipule o
                    intente adulterar el proceso de inscripción, la operación de la Prueba de Celo o
                    el Sitio, los Servicios o los Productos de Celo, o bien que vulnere los términos
                    y condiciones, lo que incluye infringir leyes o pautas.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.5. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA tiene el derecho, a su exclusivo criterio, de mantener la integridad
                    de la Prueba de Celo, de anular transacciones o acciones por cualquier razón,
                    entre ellas, el fraude, el intento de manipulación, el abuso o cualquier otra
                    conducta inapropiada, según lo determine LA EMPRESA. Todo intento por parte del
                    Usuario de dañar deliberadamente cualquier sitio web o de perjudicar la
                    operación legítima de la Prueba de Celo puede constituir una violación de la
                    ley. Si se hiciera dicho intento, LA EMPRESA se reserva el derecho de solicitar
                    una indemnización en la máxima medida que lo permita la Ley.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>4.6. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA se reserva el derecho, a su exclusivo criterio, de terminar la Prueba
                    de Celo en cualquier momento y sin notificación previa.
                  </Text>
                </Text>

                {/* Terms 5 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  5. Cláusula Quinta: Responsibilidad
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>5.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA sólo pone a disposición de los Usuarios un Sitio a fin de realizar
                    una prueba y poner a disposición de los Usuarios los Servicios mencionados para
                    comprobar las adecuaciones necesarias, de acuerdo a las disposiciones de estos
                    Términos y Condiciones. El Usuario es el único responsable por la legitimidad y
                    veracidad de los Datos Personales, como también los datos de terceros.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>5.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario conoce y acepta que al realizar operaciones con LA EMPRESA lo hace
                    bajo su propio riesgo. En ningún caso, LA EMPRESA será responsable por lucro
                    cesante, o por cualquier otro daño y/o perjuicio que haya podido sufrir el
                    Usuario, debido a los Servicios de LA EMPRESA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>5.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Al suscribirse a los presentes Términos y Condiciones, el Usuario acepta eximir
                    a la Empresa y sus subsidiarias, filiales, agencias de promoción y publicidad,
                    socios, representantes, agentes, sucesores, cesionarios, empleados, funcionarios
                    y directores de cualquier responsabilidad y culpa por enfermedad, lesión,
                    muerte, pérdida, litigación, reclamación o daño que surja de lo siguiente, así
                    sea de manera directa o indirecta, por negligencia o no: (i) su participación en
                    la Prueba de Celo o su aceptación, posesión, uso o mal uso de cualquier
                    producto, Servicio u Pago ofrecido por LA EMPRESA, ya sea en forma total o
                    parcial; (ii) fallas técnicas de cualquier tipo, incluidas, entre otras, el
                    malfuncionamiento de una computadora, teléfono celular, cable, red, hardware,
                    software o cualquier otro equipo mecánico; (iii) la falta de disponibilidad o
                    accesibilidad a cualquier transmisión, teléfono o servicio de Internet; (iv) la
                    intervención no autorizada en cualquier parte del proceso de inscripción de la
                    Prueba de Celo; (v) el error electrónico o humano en la administración de la
                    Prueba de Celo o en los Servicios y Productos de LA EMPRESA.
                  </Text>
                </Text>

                {/* Terms 6 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  6. Cláusula Sexta: Garantía del Sitio
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>6.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA no garantiza la disponibilidad y continuidad del funcionamiento del
                    Sitio. En consecuencia, LA EMPRESA no será en ningún caso responsable por
                    cualesquiera daños y perjuicios que puedan derivarse de (i) la falta de
                    disponibilidad o accesibilidad al Sitio; (ii) la interrupción en el
                    funcionamiento del Sitio o fallos informáticos, averías telefónicas,
                    desconexiones, retrasos o bloqueos causados por deficiencias o sobrecargas en
                    las líneas telefónicas, centros de datos, en los sistemas de comunicación,
                    Internet o en otros sistemas electrónicos, producidos en el curso de su
                    funcionamiento; y (iii) otros daños que puedan ser causados por terceros
                    mediante intromisiones no autorizadas ajenas al control de LA EMPRESA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>6.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA no garantiza la ausencia de virus ni de otros elementos en el Sitio
                    introducidos por terceros ajenos a LA EMPRESA que puedan producir alteraciones
                    en los sistemas físicos o lógicos del Usuario o en los documentos electrónicos y
                    archivos almacenados en sus sistemas. En consecuencia, LA EMPRESA no será en
                    ningún caso responsable de cualesquiera daños y perjuicios de toda naturaleza
                    que pudieran derivarse de la presencia de virus u otros elementos que puedan
                    producir alteraciones en los sistemas físicos o lógicos, documentos electrónicos
                    o ficheros del Usuario.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>6.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA adopta diversas medidas de protección para proteger el Sitio y los
                    contenidos contra ataques informáticos de terceros. No obstante, LA EMPRESA no
                    garantiza que terceros no autorizados no puedan conocer las condiciones,
                    características y circunstancias en las cuales el Usuario accede al Sitio. En
                    consecuencia, LA EMPRESA no será en ningún caso responsable de los daños y
                    perjuicios que pudieran derivarse de dicho acceso no autorizado.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>6.4. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Con la aceptación de los presentes Términos y Condiciones, el Usuario declara
                    que mantendrá indemne frente a cualquier reclamo a LA EMPRESA, sus empresas
                    controladas y controlantes, directores, socios, empleados, abogados y agentes,
                    derivado del (i) incumplimiento por parte de los Usuarios de cualquier
                    disposición contenida los presentes Términos y Condiciones o de cualquier ley o
                    regulación aplicable a las mismas, (ii) incumplimiento o violación de los
                    derechos de terceros incluyendo, a título meramente enunciativo, otros Usuarios;
                    y (iii) incumplimiento del uso permitido del Sitio.
                  </Text>
                </Text>

                {/* Terms 7 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  7. Cláusula Septima: Derechos de Propiedad Intelectual e Industrial
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>7.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario, reconoce y acepta que todos los derechos de propiedad intelectual e
                    industrial sobre los contenidos y/o cualesquiera otros elementos insertados en
                    el Sitio (incluyendo, sin limitación, marcas, logotipos, nombres comerciales,
                    textos, imágenes, gráficos, diseños, sonidos, bases de datos, software,
                    diagramas de flujo, presentación, audio y vídeo), pertenecen a LA EMPRESA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>7.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA autoriza al Usuario, y durante la vigencia del Servicio, a utilizar,
                    visualizar, imprimir, descargar y almacenar los contenidos y/o los elementos
                    insertados en el Sitio exclusivamente para su uso personal, privado y no
                    lucrativo, absteniéndose de realizar sobre los mismos cualquier acto de
                    descompilación, ingeniería inversa, modificación, divulgación o suministro.
                    Cualquier otro uso o explotación de cualesquiera contenidos y/u otros elementos
                    insertados en el Sitio distinto de los aquí expresamente previstos estará sujeto
                    a la autorización previa de LA EMPRESA.
                  </Text>
                </Text>

                {/* Terms 8 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  8. Cláusula Octava: Protección de Datos
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>8.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Los Datos Personales que el Usuario proporciona se integrarán en una base de
                    datos personales del que es responsable LA EMPRESA, cuya dirección figura en el
                    encabezamiento del presente documento.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>8.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA declara que los Datos Personales de los Usuarios, serán utilizados
                    únicamente con el fin de la prueba mencionada en la CLAUSULA PRIMERA.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>8.3. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Los Usuarios podrán ejercitar los derechos de acceder, rectificar, suprimir y
                    actualizar su Información Personal, así como a oponerse al tratamiento de la
                    misma, todo ello de conformidad a lo dispuesto en la normativa aplicable (Ley
                    25.326 - Ley de Protección de Datos Personales).
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>8.4. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA, se compromete a garantizar el cumplimiento de lo establecido en la
                    ley 25.326 y el decreto 1558/2001 respecto de la Protección de los Datos
                    Personales, de los usuarios y/o de cualquier tercero, así como de garantizar los
                    derechos conferidos en la normativa mencionada
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>8.5. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    La información presentada por el Usuario como parte de la Prueba de Celo se
                    encontrará sujeta a la Política de Privacidad. Para leer la Política de
                    privacidad, <Link href={'/arg_privacy'}>haga clic aquí</Link>.
                  </Text>
                </Text>

                {/* Terms 9 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  9. Cláusula NOVENA: CONTROVERSIAS.
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Las partes reconocen que esta es una prueba limitada con responsabilidad y
                    obligación limitada por parte de LA EMPRESA. LA EMPRESA tiene interés en saber
                    sobre su experiencia con la Prueba de Celo, con los Servicios y Productos de LA
                    EMPRESA y desea resolver toda posible controversia cordialmente.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    EL USUARIO COMPRENDE QUE LA PRUEBA DE CELO SE RIGE POR LAS LEYES DE LA
                    ARGENTINA, SIN CONSIDERAR LAS DOCTRINAS DE CONFLICTO DE LEYES.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Como una condición de participar en la Prueba de Celo, el Usuario acepta que
                    todas las controversias que no puedan resolverse entre las Partes, y las causas
                    de acción que surjan o se conecten con esta Prueba de Celo, se resolverán de
                    manera individual, sin recurrir a ninguna clase de demanda colectiva,
                    exclusivamente ante los Tribunales Ordinarios de la Ciudad de Buenos Aires.
                    Además, en caso de alguna controversia, el Usuario no podrá en ninguna
                    circunstancia obtener indemnizaciones por daños incidentales, punitivos o
                    emergentes, lo que incluye honorarios razonables de abogados, que no sean los
                    gastos de bolsillo reales del Usuario (es decir, los costos asociados con
                    ingresar en la Prueba de Celo), por lo que renuncia cualquier derecho a ello.
                    Además, el Usuario renuncia a todos los derechos a multiplicar o incrementar los
                    daños y perjuicios.
                  </Text>
                </Text>

                {/* Terms 10 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  10. Cláusula Décima: Acuerdo y Consideraciones de SMS
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>10.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Al participar en la Prueba de Celo, el Usuario acepta recibir mensajes de texto
                    de LA EMPRESA y otros Usuarios de la Prueba de Celo. Además, si el Usuario
                    acepta participar en Recompensas Celo, el Usuario acepta enviar mensajes de
                    texto para participar en los procesos de verificación. El Usuario entiende que
                    pueden aplicarse tarifas estándar de mensajes de texto, lo que depende de su
                    proveedor de telefonía celular. La Prueba de Celo está diseñada para funcionar
                    con la mayoría de los proveedores de servicios móviles, pero LA EMPRESA no
                    garantiza que todos ellos serán compatibles con la Prueba de Celo ni que todo
                    teléfono celular utilizado será capaz de enviar y recibir mensajes de texto.
                  </Text>
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>10.2. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario comprende que todos los proveedores de servicios móviles pueden
                    cobrarle por cada mensaje de texto, incluidos los mensajes de error, que se
                    envíe o reciba en conexión con la Prueba de Celo. Le recomendamos que consulte
                    el plan de precios de su proveedor de servicios móviles para obtener todos los
                    detalles pertinentes. Al participar en la Prueba de Celo, el Usuario es el único
                    responsable de abonar todos los cargos por servicio inalámbrico.
                  </Text>
                </Text>

                {/* Terms 11 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  11. Cláusula Décima Primera: Notificaciones
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>11.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    LA EMPRESA podrá realizar las notificaciones oportunas al Usuario a través de
                    una notificación general en el Sitio. El Usuario podrá notificar a LA EMPRESA
                    mediante el envío de un correo electrónico a la dirección
                  </Text>
                </Text>

                {/* Terms 12 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  12. Cláusula Decimo Segunda: Cesión
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>12.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    El Usuario no podrá ceder sus derechos y obligaciones emanadas de los presentes
                    Términos y Condiciones sin el previo consentimiento por escrito de LA EMPRESA.
                    LA EMPRESA podrá ceder, sin necesidad de recabar el consentimiento previo del
                    Usuario, los presentes Términos y Condiciones a cualquier entidad comprendida
                    dentro de su grupo de sociedades, en todo el mundo, así como a cualquier persona
                    o entidad que le suceda en el ejercicio de su negocio por cualesquiera títulos.
                  </Text>
                </Text>

                {/* Terms 13 */}
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  13. Cláusula Decimo Tercera: Ley aplicable y jurisdicción
                </Text>
                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={TextStyles.semibold16}>13.1. </Text>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Las presentes Términos y Condiciones, así como la relación entre LA EMPRESA y el
                    Usuario, se regirán e interpretarán con arreglo a la legislación vigente en la
                    República Argentina.
                  </Text>
                </Text>

                <Text style={[TextStyles.smallMain, styles.termItem]}>
                  <Text style={[TextStyles.smallMain, styles.termItem]}>
                    Al marcar esta casilla, el Usuario, declara que efectivamente revisó, aceptó y
                    acordó a todas las Reglas Oficiales.
                  </Text>
                </Text>
              </Responsive>
            </View>
          </View>
        </View>
      </View>
    )
  }
}

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
  termItem: {
    paddingVertical: 10,
  },
  subitem: {
    marginLeft: 15,
  },
})
