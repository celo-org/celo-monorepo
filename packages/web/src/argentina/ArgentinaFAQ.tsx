import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Link from 'src/shared/Link'
import Responsive from 'src/shared/Responsive'
import { TextStyles } from 'src/shared/Styles'
import { ResponsiveH1 } from 'src/shared/Text'

export default class Argentina extends React.Component {
  render() {
    return (
      <View>
        <Head>
          <title>Celo - Argentina Frequently Asked Questions</title>
          <meta
            name="description"
            content="This page informs you about our pilot project in Argentina"
          />
        </Head>

        <View style={styles.container}>
          <View style={styles.maxWidth}>
            <View style={styles.headerBox}>
              <ResponsiveH1 style={styles.header}>
                Prueba Argentina: preguntas frecuentes de los usuarios
              </ResponsiveH1>
            </View>
            <View style={styles.communityBox}>
              <Responsive>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>¿Qué es Celo?</Text>
                <Text style={TextStyles.smallMain}>
                  Celo es una plataforma para pagos digitales rápidos, seguros y estables a
                  cualquier número de teléfono móvil a una fracción del costo actual. Puede obtener
                  más información <Link href={'/'}>aquí</Link>.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Cómo puedo solicitar mis USD 50?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Al finalizar la prueba, el 27 de mayo del 2019, abriremos una ventana de 14 días
                  para que los participantes del concurso Celo puedan visitar al embajador local
                  para recibir sus USD honorarios. Es primordial que los participantes visiten a
                  este Embajador de Celo para recibir los USD 50 por la participación en la prueba.
                  Pasados los 14 días, los fondos ya no estarán disponibles.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué es el peso honorario por 3 meses?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Después de ejecutar la prueba durante 90 días, habrá un período de 7 días durante
                  el cual los usuarios podrán visitar al Embajador de Celo local y finalizar su
                  participación en la prueba por un [peso] honorario. Pasados los 7 días, esta
                  ventana se cerrará. La próxima oportunidad de recibir el honorario que tendrán los
                  usuarios será al final de la prueba de 6 meses.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Cuál es mi clave de respaldo? ¿Es importante?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Su clave de respaldo es *muy importante* y debe asegurarse de no perderla. Puede
                  recuperar su clave de respaldo ingresando a la «configuración de su cuenta» (el
                  símbolo de «engranaje» que se ve en la esquina superior derecha de la pantalla de
                  su billetera) y, luego, seleccionando «Clave de respaldo». Tendrá 7 días después
                  de abrir su billetera para tomar nota de esta clave de respaldo. Una vez que haya
                  accedido a la clave de respaldo, o al final de los 7 días, esta se borrará por
                  completo. Donde sea que decida anotarla y guardarla de manera segura, ¡no la
                  pierda!
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Con quién debo compartir mi clave de respaldo?
                </Text>
                <Text style={TextStyles.smallMain}>
                  En caso de que algo le suceda a su teléfono, o si pierde el acceso a su billetera,
                  su clave de respaldo es la única manera de volver a abrir su billetera Celo y
                  acceder a los saldos guardados en ella. La aplicación Celo le permite compartir su
                  clave de respaldo con otra persona, quien debe ser alguien en quien confíe
                  plenamente en lo que respecta a sus posesiones (podría ser su pareja o un familiar
                  cercano, por ejemplo). No la comparta con alguien a quien conozca casualmente, ya
                  que ella da acceso individual a sus saldos de Celo.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  Perdí mi teléfono y ya no puedo acceder a mi billetera, ¿qué hago?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Si perdió su teléfono, o simplemente no puede acceder a su billetera, necesita esa
                  clave de respaldo que anotó al configurar su billetera. Vuelva a descargar la
                  billetera desde la tienda de Google Play y, luego, toque el enlace «¿Ya tiene una
                  billetera de Celo? Impórtela» cuando abra la aplicación. A partir de ahí, se le
                  pedirá que ingrese su clave de respaldo y, luego, ¡debería estar listo para
                  comenzar!
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué son los Celo dólares y qué es el Celo oro?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Los Celo dólares son una forma de enviar y recibir valor, y hacer pagos sociales a
                  sus amigos. Si quiere agradecerle a un amigo por la cena de anoche, puede enviarle
                  Celo dólares. El Celo oro se parece más al oro real; hay una cantidad fija de él
                  y, en consecuencia, su precio puede subir o bajar según la demanda. Puede mantener
                  sus valores en forma de Celo oro o Celo dólares.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué sucede si quiero invitar a alguien, pero no deseo enviarle dinero?
                </Text>
                <Text style={TextStyles.smallMain}>
                  ¡Puede hacerlo! Simplemente haga clic en la configuración de su perfil (el símbolo
                  de «engranaje» que aparece en la esquina superior derecha). Desde allí, seleccione
                  «Invitar amigos» y envíe una invitación a alguien que le gustaría que se uniera a
                  la prueba. Tenga en cuenta que, si bien no necesita enviar dinero, se le exigirá
                  que pague una tarifa de «combustible» baja para cubrir los costos de verificación
                  en la red de su amigo.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué es una tarifa de «combustible» y por qué se me cobra una tarifa?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Para realizar ciertas transacciones, los usuarios deben pagar una «tarifa» baja
                  para que se realicen los cálculos reales, de modo que cuando vea una «tarifa»,
                  como al invitar a alguien, por ejemplo, eso cubre los costos de cálculo de la red.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Puedo obtener la aplicación Billetera de Celo en mi iPhone?
                </Text>
                <Text style={TextStyles.smallMain}>
                  No, por el momento. Por ahora, la Billetera de Celo se encuentra solo disponible
                  en Android.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Cuál es la diferencia entre mi PIN y mi clave de respaldo?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Su PIN es como el código que usa en el cajero automático, una manera fácil de
                  acceder a su billetera que permite transacciones seguras. Su clave de respaldo es
                  la manera de restaurar su billetera y saldos si alguna vez queda bloqueado o
                  pierde su teléfono. Ambos son importantes, pero su clave de respaldo es
                  absolutamente esencial y nunca debe perderse.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Por qué me siguen pidiendo mi PIN?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Necesitará su PIN para acceder a su billetera y saldos. El PIN existe para
                  garantizar que su cuenta esté segura. Si un tercero lograra tener acceso a su
                  teléfono, por ejemplo, e intentara iniciar una transacción grande, se le
                  solicitaría que ingrese el PIN. Es un mecanismo de seguridad para protegerlo y
                  debe mantenerse confidencial. Una vez que establezca su PIN, no podrá cambiarlo.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué sucede si mi amigo nunca reclama su dinero?
                </Text>
                <Text style={TextStyles.smallMain}>
                  ¡Asegúrese de alentarlo a que lo haga! Deberá configurar una billetera para
                  recibir la transacción. En el futuro, tendremos una función que devuelva el valor
                  al remitente si el invitado no lo reclama dentro de los 30 días, pero esa función
                  no está disponible en este momento.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Puedo enviar Celo dólares a alguien fuera de Argentina?
                </Text>
                <Text style={TextStyles.smallMain}>
                  No, por el momento. Por ahora, el servicio se encuentra disponible solamente
                  dentro de Argentina. El código de país del número de teléfono del usuario debe ser
                  de Argentina, pero no se preocupe: aún puede usar la aplicación mientras viaja.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Por qué veo mis fotos desde mi teléfono dentro de la aplicación?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Si le otorga permiso a la aplicación Billetera de Celo para leer los nombres y ver
                  las fotos de sus contactos, verá esas fotos en la billetera. Esto permite una
                  experiencia mejor y más personalizada, y esos datos sólo estarán disponibles para
                  usted en su dispositivo. No se compartirán con otros usuarios.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué es la aplicación Celo Rewards?
                </Text>
                <Text style={TextStyles.smallMain}>
                  La aplicación Celo Rewards es una manera mediante la que cualquier usuario puede
                  ganar más Celo oro en el sistema. El usuario puede hacerlo participando
                  activamente en el proceso de verificación de otros usuarios. Si descarga la
                  aplicación y tiene capacidad de sobra para enviar mensajes de texto, entonces
                  puede ganar valor adicional por enviar los mensajes de texto de verificación.
                  Tenga en cuenta que el proveedor puede aplicar cargos por el envío de esos
                  mensajes. La aplicación se encuentra disponible aquí.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  Estoy intentando invitar a alguien, pero no puedo. ¿Por qué?
                </Text>
                <Text style={TextStyles.smallMain}>
                  En este punto, es probable que se haya quedado sin Celo oro. Necesita Celo oro
                  para cubrir las tarifas asociadas a la ejecución de la red.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Cómo obtengo más Celo oro para cubrir las tarifas?
                </Text>
                <Text style={TextStyles.smallMain}>
                  ¡Descargue la aplicación Celo Rewards aquí!
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué sucede si tengo más de USD 50 en Celo dólares o Celo oro?
                </Text>
                <Text style={TextStyles.smallMain}>
                  Lo máximo que recibirá al finalizar la prueba serán USD 50. Si ha acumulado más
                  que eso en Celo dólares o Celo oro, comience a enviarles algunos Celo dólares a
                  sus amigos. ¡Comparta la experiencia!
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Puedo cancelar una transacción que ya he realizado?
                </Text>
                <Text style={TextStyles.smallMain}>
                  No hay forma de cancelar una transacción una vez que ya se realizó; por lo tanto,
                  asegúrese de enviarle el valor a la persona correcta.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué pasa si la información que se incluye aquí no responde mi pregunta?
                </Text>
                <Text style={TextStyles.smallMain}>
                  En este punto, le recomendamos que visite al Embajador de Celo local en su campus.
                </Text>
                <Text style={TextStyles.smallMain}>
                  Es muy amigable y podrá ayudarlo con sus necesidades.
                </Text>
                <Text style={[TextStyles.semibold16, styles.subtitle]}>
                  ¿Qué sucede cuando verifico mi número de teléfono?
                </Text>
                <Text style={TextStyles.smallMain}>
                  La plataforma Celo verifica los números telefónicos asociados a toda billetera
                  creada. Para eso, el protocolo envía 3 mensajes de texto con mensajes privados que
                  solo usted pudo haber recibido en su número de teléfono. Una vez que su teléfono
                  confirme estos mensajes, su estado en la plataforma pasa a ser verificado.
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
})
