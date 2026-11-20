# n8n-nodes-oryksa

[![English](https://img.shields.io/badge/English-30363d?style=for-the-badge)](README.md) [![Português](https://img.shields.io/badge/Portugu%C3%AAs-30363d?style=for-the-badge)](README.pt.md) [![Español](https://img.shields.io/badge/Espa%C3%B1ol-0891b2?style=for-the-badge)](README.es.md) [![Français](https://img.shields.io/badge/Fran%C3%A7ais-30363d?style=for-the-badge)](README.fr.md)

Este es un nodo de la comunidad de n8n. Te permite usar [ORYKSA](https://oryksa.com) en tus workflows de n8n.

ORYKSA es un asistente de IA para tu negocio. Con este nodo, un workflow puede usar ORYKSA como su modelo de IA, preguntar a tu propio asistente ORYKSA (que conoce tu negocio), dejar que actúe por ti con tu aprobación, crear imágenes, convertir audio en texto y texto en voz, y arrancar cuando algo ocurre en ORYKSA.

Todo se paga con las interacciones de tu plan de ORYKSA. No hay un crédito aparte ni otra clave de proveedor de IA que gestionar.

[Instalación](#instalación) · [Credenciales](#credenciales) · [Operaciones](#operaciones) · [Ejemplos](#ejemplos) · [Extracto de uso](#extracto-de-uso) · [Compatibilidad](#compatibilidad) · [Recursos](#recursos) · [Autor](#autor)

## Instalación

Sigue la [guía de instalación](https://docs.n8n.io/integrations/community-nodes/installation/) de la documentación de los community nodes de n8n e instala `n8n-nodes-oryksa`.

### Instalación manual desde un archivo de paquete

Mientras el paquete no esté en npm, puedes instalar el archivo `.tgz` a mano. En la carpeta donde n8n guarda los community nodes (`~/.n8n/nodes`, créala si no existe) ejecuta:

```bash
npm install --omit=dev --legacy-peer-deps --ignore-scripts --package-lock=false ./n8n-nodes-oryksa-0.1.2.tgz
```

Después reinicia n8n. Las opciones importan: sin ellas npm intenta instalar y compilar los paquetes propios de n8n, que n8n ya tiene.

n8n solo carga community nodes no verificados cuando `N8N_UNVERIFIED_PACKAGES_ENABLED` es `true`. Es el valor por defecto hoy; n8n ha anunciado que pasará a `false`, así que defínelo tú si los nodos no aparecen.

## Credenciales

1. Inicia sesión en [developer.oryksa.com](https://developer.oryksa.com) y abre **API keys**.
2. Crea una clave. Empieza por `oryk_live_`.
3. En n8n, crea una credencial **ORYKSA API** y pega la clave.

n8n prueba la clave cuando la guardas.

## Operaciones

### Nodo ORYKSA

| Resource | Operation | Qué hace | Coste |
| --- | --- | --- | --- |
| Model | Message a Model | Envía un prompt a ORYKSA como modelo de IA general, en lugar de otro proveedor de IA. Admite prompt de sistema, salida JSON, temperatura y límite de tokens. | 1 interacción por respuesta |
| Assistant | Ask | Pregunta a tu propio asistente ORYKSA. Responde con el conocimiento y los datos de tu negocio. Nunca actúa. | 1 interacción por respuesta |
| Assistant | Do | Pide a tu asistente que haga algo. Lo que se queda dentro de tu cuenta (un contacto, una tarea, una nota) se hace al instante. Todo lo que se envía a otra persona, y cualquier cambio de ajustes, espera una aprobación. | 1 interacción por respuesta, más lo que cueste la acción |
| Assistant | Approve | Ejecuta lo que un **Do** anterior dejó en espera. El ID de la aprobación viene en la salida de **Do**. | Lo que cueste la acción aprobada |
| Image | Create | Crea una imagen a partir de una descripción, en el tamaño exacto que elijas, y devuelve su dirección y el archivo. | 10 interacciones |
| Audio | Transcribe | Convierte una grabación en texto, con el inicio y el final de cada palabra. | 1 interacción por minuto iniciado |
| Audio | Generate Speech | Lee un texto en voz alta con la voz de tu cuenta ORYKSA y devuelve un mp3. | 1 interacción por cada 500 caracteres iniciados |
| Customer Agent | Send Message | Envía un mensaje al agente de ORYKSA que atiende a tus clientes y devuelve su respuesta. | 1 interacción por respuesta |
| Knowledge | Get Status, Add FAQ, Learn Website | Lee y amplía lo que sabe tu agente. | Consulta la referencia de la API |
| Conversation | Get, Get Many | Lee las conversaciones de tus clientes con tu agente. | Consulta la referencia de la API |

**Do** nunca aprueba por sí mismo. Un workflow tiene que llamar a **Approve** con el ID de la aprobación, normalmente después de que una persona haya dicho que sí (por ejemplo con un nodo Wait y un formulario). Una aprobación es válida durante 60 minutos.

### Nodo ORYKSA Trigger

Inicia el workflow cuando algo ocurre en tu cuenta de ORYKSA: se respondió un mensaje, se creó una reserva, se actualizó el conocimiento, se alcanzó el límite de interacciones.

El nodo registra un webhook en ORYKSA cuando el workflow se activa y lo elimina cuando el workflow se desactiva. Cada evento va firmado, y el nodo comprueba la firma antes de iniciar el workflow.

## Ejemplos

### 1. Usar ORYKSA como el modelo de un workflow

1. Añade un nodo **ORYKSA**. Resource **Model**, operation **Message a Model**.
2. Escribe las instrucciones en **System Prompt** y el texto en **Message**, por ejemplo `{{ $json.text }}`.
3. La respuesta llega en `choices[0].message.content`.

### 2. Responder a un correo de un cliente con tu aprobación

1. Un trigger te da el correo (por ejemplo **Gmail Trigger**).
2. Nodo **ORYKSA**, resource **Assistant**, operation **Do**. Message: `Reply to this email.` Input: el texto del correo.
3. La salida tiene `status: needs_approval`, el texto que se enviará y `approval.id`.
4. Un nodo **Wait** con un formulario te muestra el texto y pregunta sí o no.
5. Si es sí: nodo **ORYKSA**, resource **Assistant**, operation **Approve**, con `{{ $json.approval.id }}`. El correo se envía.

### 3. Subtítulos para un vídeo

1. Obtén el audio del vídeo como archivo binario.
2. Nodo **ORYKSA**, resource **Audio**, operation **Transcribe**. Deja **Word Times** activado.
3. La salida tiene `text` y `words`, cada palabra con `start` y `end` en segundos. Construye los subtítulos a partir de ellas.

## Extracto de uso

El nodo le dice a ORYKSA de qué workflow viene cada solicitud (el nombre y el ID del workflow, y el ID de la ejecución). Tu extracto de uso de ORYKSA muestra entonces las interacciones bajo **n8n**, con el nombre del workflow, y las suma por workflow. Es solo una etiqueta: no da ningún permiso y no cambia ningún precio.

## Compatibilidad

Construido y verificado con las herramientas de nodos de n8n (`@n8n/node-cli`). Necesita una versión de n8n que admita community nodes con `n8nNodesApiVersion` 1. Sin dependencias externas.

## Recursos

- [Documentación de los community nodes de n8n](https://docs.n8n.io/integrations/#community-nodes)
- [Referencia de la API de ORYKSA](https://developer.oryksa.com)
- [ORYKSA](https://oryksa.com)

## Autor

Weslley Harakawa ([@weslleyharakawa](https://github.com/weslleyharakawa))

## Licencia

[MIT](LICENSE.md)
