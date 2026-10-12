# n8n-nodes-oryksa

This is an n8n community node. It lets you use [ORYKSA](https://oryksa.com) in your n8n workflows.

ORYKSA is an AI assistant for your business. With this node a workflow can use ORYKSA as its AI model, ask your own ORYKSA assistant (which knows your business), let it act for you with your approval, create pictures, turn audio into text and text into voice, and start when something happens in ORYKSA.

Everything is paid with the interactions of your ORYKSA plan. There is no separate credit and no other AI provider key to manage.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Examples](#examples) · [Usage statement](#usage-statement) · [Compatibility](#compatibility) · [Resources](#resources) · [Author](#author)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install `n8n-nodes-oryksa`.

### Manual installation from a package file

Until the package is on npm you can install the `.tgz` file by hand. In the folder where n8n keeps community nodes (`~/.n8n/nodes`, create it if it does not exist) run:

```bash
npm install --omit=dev --legacy-peer-deps --ignore-scripts --package-lock=false ./n8n-nodes-oryksa-0.1.2.tgz
```

Then restart n8n. The options matter: without them npm tries to install and compile n8n's own packages, which n8n already has.

n8n only loads community nodes that are not verified when `N8N_UNVERIFIED_PACKAGES_ENABLED` is `true`. That is the default today; n8n has announced that it will become `false`, so set it yourself if the nodes do not appear.

## Credentials

1. Sign in at [developer.oryksa.com](https://developer.oryksa.com) and open **API keys**.
2. Create a key. It starts with `oryk_live_`.
3. In n8n, create an **ORYKSA API** credential and paste the key.

n8n tests the key when you save it.

## Operations

### ORYKSA node

| Resource | Operation | What it does | Cost |
| --- | --- | --- | --- |
| Model | Message a Model | Sends a prompt to ORYKSA as a general AI model, in place of another AI provider. Supports a system prompt, JSON output, temperature and a token limit. | 1 interaction per reply |
| Assistant | Ask | Asks your own ORYKSA assistant. It answers with the knowledge and the data of your business. It never acts. | 1 interaction per reply |
| Assistant | Do | Asks your assistant to do something. What stays inside your account (a contact, a task, a note) is done at once. Anything sent to another person, and any change to settings, waits for an approval. | 1 interaction per reply, plus what the action costs |
| Assistant | Approve | Runs what a previous **Do** left waiting. The approval ID comes in the output of **Do**. | What the approved action costs |
| Image | Create | Creates one picture from a description, in the exact size you choose, and returns its address and the file. | 10 interactions |
| Audio | Transcribe | Turns a recording into text, with the start and the end of every word. | 1 interaction per started minute |
| Audio | Generate Speech | Reads a text aloud with the voice of your ORYKSA account and returns an mp3. | 1 interaction per started 500 characters |
| Customer Agent | Send Message | Sends a message to the ORYKSA agent that answers your customers and returns its reply. | 1 interaction per reply |
| Knowledge | Get Status, Add FAQ, Learn Website | Reads and extends what your agent knows. | See the API reference |
| Conversation | Get, Get Many | Reads the conversations of your customers with your agent. | See the API reference |

**Do** never approves by itself. A workflow has to call **Approve** with the approval ID, usually after a person said yes (for example with a Wait node and a form). An approval is valid for 60 minutes.

### ORYKSA Trigger node

Starts the workflow when something happens in your ORYKSA account: a message was replied, a booking was created, the knowledge was updated, the interaction limit was reached.

The node registers a webhook in ORYKSA when the workflow is activated and removes it when the workflow is deactivated. Every event is signed, and the node checks the signature before starting the workflow.

## Examples

### 1. Use ORYKSA as the model of a workflow

1. Add an **ORYKSA** node. Resource **Model**, operation **Message a Model**.
2. Write the instructions in **System Prompt** and the text in **Message**, for example `{{ $json.text }}`.
3. The reply comes in `choices[0].message.content`.

### 2. Reply to a customer email with your approval

1. A trigger gives you the email (for example **Gmail Trigger**).
2. **ORYKSA** node, resource **Assistant**, operation **Do**. Message: `Reply to this email.` Input: the text of the email.
3. The output has `status: needs_approval`, the text that will be sent and `approval.id`.
4. A **Wait** node with a form shows you the text and asks yes or no.
5. If yes: **ORYKSA** node, resource **Assistant**, operation **Approve**, with `{{ $json.approval.id }}`. The email is sent.

### 3. Subtitles for a video

1. Get the audio of the video as a binary file.
2. **ORYKSA** node, resource **Audio**, operation **Transcribe**. Leave **Word Times** on.
3. The output has `text` and `words`, each word with `start` and `end` in seconds. Build the subtitles from them.

## Usage statement

The node tells ORYKSA which workflow each request comes from (the name and the ID of the workflow, and the ID of the execution). Your ORYKSA usage statement then shows the interactions under **n8n**, with the name of the workflow, and adds them up by workflow. This is only a label: it gives no permission and changes no price.

## Compatibility

Built and linted with the n8n node tools (`@n8n/node-cli`). Needs an n8n version that supports community nodes with `n8nNodesApiVersion` 1. No external dependencies.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [ORYKSA API reference](https://developer.oryksa.com)
- [ORYKSA](https://oryksa.com)

## Author

Weslley Harakawa ([@weslleyharakawa](https://github.com/weslleyharakawa))

## License

[MIT](LICENSE.md)
