import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { compact, oryksaRequest, oryksaUpload } from './GenericFunctions';

export class Oryksa implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ORYKSA',
		name: 'oryksa',
		icon: { light: 'file:../../icons/oryksa.svg', dark: 'file:../../icons/oryksa.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Use ORYKSA as the AI model of your flow, ask your ORYKSA assistant, or let it act for you',
		defaults: {
			name: 'ORYKSA',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'oryksaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Assistant',
						value: 'assistant',
						description: 'Your own ORYKSA assistant, with the data of your business',
					},
					{
						name: 'Audio',
						value: 'audio',
						description: 'Turn audio into text, or text into voice',
					},
					{
						name: 'Conversation',
						value: 'conversation',
						description: 'Conversations of your customers with your ORYKSA agent',
					},
					{
						name: 'Customer Agent',
						value: 'customerAgent',
						description: 'The ORYKSA agent that answers your customers',
					},
					{
						name: 'Image',
						value: 'image',
						description: 'Create pictures',
					},
					{
						name: 'Knowledge',
						value: 'knowledge',
						description: 'What your ORYKSA agent knows about your business',
					},
					{
						name: 'Model',
						value: 'model',
						description: 'ORYKSA as a general AI model, in place of another AI provider',
					},
				],
				default: 'model',
			},

			// ------------------------------------------------------------ operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['model'] } },
				options: [
					{
						name: 'Message a Model',
						value: 'message',
						description: 'Send a prompt to the ORYKSA model and get its reply',
						action: 'Message a model',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['assistant'] } },
				options: [
					{
						name: 'Approve',
						value: 'approve',
						description: 'Run what a previous Do request left waiting for approval',
						action: 'Approve what the assistant prepared',
					},
					{
						name: 'Ask',
						value: 'ask',
						description: 'Ask your assistant a question. It only answers and never acts.',
						action: 'Ask the assistant',
					},
					{
						name: 'Do',
						value: 'do',
						description:
							'Ask your assistant to do something. Anything it sends to another person waits for approval.',
						action: 'Ask the assistant to do something',
					},
				],
				default: 'ask',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['customerAgent'] } },
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a customer message and get the reply of your agent',
						action: 'Send a customer message to the agent',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['knowledge'] } },
				options: [
					{
						name: 'Add FAQ',
						value: 'addFaq',
						description: 'Add a question and its answer to what the agent knows',
						action: 'Add a FAQ to the knowledge',
					},
					{
						name: 'Get Status',
						value: 'get',
						description: 'Get how much the agent knows: pages, FAQ items, services',
						action: 'Get the status of the knowledge',
					},
					{
						name: 'Learn Website',
						value: 'crawl',
						description: 'Read the pages of a public website and learn them',
						action: 'Learn a website',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['conversation'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get the messages of one conversation',
						action: 'Get a conversation',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get the most recent conversations',
						action: 'Get many conversations',
					},
				],
				default: 'getAll',
			},

			// ------------------------------------------------------------ model: message
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				displayOptions: { show: { resource: ['model'], operation: ['message'] } },
				options: [
					{
						name: 'ORYKSA',
						value: 'oryksa',
						description:
							'The general model. It follows your prompt exactly and knows nothing about your account.',
					},
					{
						name: 'ORYKSA Assistant',
						value: 'oryksa-assistant',
						description:
							'Your own assistant, with the knowledge and the data of your business. It only answers.',
					},
				],
				default: 'oryksa',
			},
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['model'], operation: ['message'] } },
				default: '',
				placeholder: 'e.g. You write short LinkedIn posts. One idea, no hashtags.',
				description: 'The instructions the model follows. Leave empty for none.',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['model'], operation: ['message'] } },
				default: '',
				required: true,
				placeholder: 'e.g. Write a post about our new opening hours',
				description: 'The text the model answers',
			},
			{
				displayName: 'Options',
				name: 'modelOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: { show: { resource: ['model'], operation: ['message'] } },
				default: {},
				options: [
					{
						displayName: 'JSON Output',
						name: 'jsonOutput',
						type: 'boolean',
						default: false,
						description:
							'Whether the reply must be a JSON object. Say in the prompt which keys you want.',
					},
					{
						displayName: 'Maximum Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 2000 },
						default: 1000,
						description: 'The most tokens the reply may have (up to 2000)',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 1 },
						default: 0.7,
						description: 'How much the reply varies: 0 is steady, higher is more creative',
					},
				],
			},

			// ------------------------------------------------------------ assistant: ask and do
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['assistant'], operation: ['ask', 'do'] } },
				default: '',
				required: true,
				placeholder: 'e.g. How many bookings do I have today?',
				description:
					'Your own instruction to the assistant. Never put text written by other people here: use Input for that.',
			},
			{
				displayName: 'Input',
				name: 'input',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['assistant'], operation: ['ask', 'do'] } },
				default: '',
				description:
					'Content written by someone else for the assistant to work on, such as a received email. It is treated as data and can never give orders.',
			},
			{
				displayName:
					'Anything the assistant sends to another person (an email, a message, a post) is not sent by this operation. The reply comes back with the status needs_approval and an approval ID. Use the Approve operation to send it.',
				name: 'approvalNotice',
				type: 'notice',
				displayOptions: { show: { resource: ['assistant'], operation: ['do'] } },
				default: '',
			},
			{
				displayName: 'Options',
				name: 'assistantOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: { show: { resource: ['assistant'], operation: ['ask', 'do'] } },
				default: {},
				options: [
					{
						displayName: 'Conversation ID',
						name: 'conversationId',
						type: 'string',
						default: '',
						description:
							'The conversation ID of a previous reply, to continue that conversation',
					},
					{
						displayName: 'Create Picture',
						name: 'image',
						type: 'boolean',
						default: false,
						description:
							'Whether the assistant may create one picture in this request. Only for the Do operation. A picture uses 10 interactions.',
					},
					{
						displayName: 'Keep in History',
						name: 'newConversation',
						type: 'boolean',
						default: false,
						description:
							'Whether to start a conversation that is kept in the history of your ORYKSA app',
					},
					{
						displayName: 'Language',
						name: 'lang',
						type: 'options',
						options: [
							{ name: 'Account Language', value: '' },
							{ name: 'English', value: 'en' },
							{ name: 'Portuguese (Brazil)', value: 'pt-BR' },
							{ name: 'Portuguese (Portugal)', value: 'pt' },
							{ name: 'Spanish', value: 'es' },
						],
						default: '',
						description: 'The language of the fixed sentences of the reply',
					},
				],
			},

			// ------------------------------------------------------------ assistant: approve
			{
				displayName: 'Approval ID',
				name: 'approvalId',
				type: 'string',
				displayOptions: { show: { resource: ['assistant'], operation: ['approve'] } },
				default: '',
				required: true,
				placeholder: 'apr_...',
				description:
					'The approval ID a Do request returned. It works once and lasts 60 minutes.',
			},

			// ------------------------------------------------------------ customer agent
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: { rows: 3 },
				displayOptions: { show: { resource: ['customerAgent'], operation: ['sendMessage'] } },
				default: '',
				required: true,
				description: 'The message of the customer, up to 2000 characters',
			},
			{
				displayName: 'Options',
				name: 'agentOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: { show: { resource: ['customerAgent'], operation: ['sendMessage'] } },
				default: {},
				options: [
					{
						displayName: 'Conversation ID',
						name: 'conversationId',
						type: 'string',
						default: '',
						description:
							'Your own ID for this customer or thread. Reuse it to keep the context.',
					},
					{
						displayName: 'Customer Name',
						name: 'customerName',
						type: 'string',
						default: '',
						description: 'The name of the customer, used by the agent in its replies',
					},
				],
			},

			// ------------------------------------------------------------ knowledge
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				displayOptions: { show: { resource: ['knowledge'], operation: ['addFaq'] } },
				default: '',
				required: true,
				description: 'The question customers ask',
			},
			{
				displayName: 'Answer',
				name: 'answer',
				type: 'string',
				typeOptions: { rows: 3 },
				displayOptions: { show: { resource: ['knowledge'], operation: ['addFaq'] } },
				default: '',
				required: true,
				description: 'The answer the agent gives',
			},
			{
				displayName: 'Website URL',
				name: 'url',
				type: 'string',
				displayOptions: { show: { resource: ['knowledge'], operation: ['crawl'] } },
				default: '',
				required: true,
				placeholder: 'e.g. https://example.com',
				description: 'The address of a public website',
			},
			{
				displayName: 'Maximum Pages',
				name: 'maxPages',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 50 },
				displayOptions: { show: { resource: ['knowledge'], operation: ['crawl'] } },
				default: 20,
				description: 'The most pages to read',
			},

			// ------------------------------------------------------------ image
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['image'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create one picture from a description (10 interactions)',
						action: 'Create an image',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['image'], operation: ['create'] } },
				default: '',
				required: true,
				description: 'What the picture should show',
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'options',
				displayOptions: { show: { resource: ['image'], operation: ['create'] } },
				options: [
					{ name: 'Landscape (1536 × 1024)', value: '1536x1024' },
					{ name: 'Portrait (1024 × 1536)', value: '1024x1536' },
					{ name: 'Square (1024 × 1024)', value: '1024x1024' },
					{ name: 'Tall (1024 × 1792)', value: '1024x1792' },
					{ name: 'Wide (1792 × 1024)', value: '1792x1024' },
				],
				default: '1024x1024',
				description: 'The picture comes in exactly these pixels',
			},
			{
				displayName: 'Download the Picture',
				name: 'download',
				type: 'boolean',
				displayOptions: { show: { resource: ['image'], operation: ['create'] } },
				default: true,
				description: 'Whether to put the file in the output, besides its address',
			},
			{
				displayName: 'Put Output File in Field',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: { show: { resource: ['image'], operation: ['create'], download: [true] } },
				default: 'data',
				required: true,
				hint: 'The name of the output binary field to put the file in',
			},

			// ------------------------------------------------------------ audio
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['audio'] } },
				options: [
					{
						name: 'Generate Speech',
						value: 'speech',
						description: 'Read a text aloud with the voice of your account (1 interaction per 500 characters)',
						action: 'Generate speech',
					},
					{
						name: 'Transcribe',
						value: 'transcribe',
						description: 'Turn a recording into text, with the time of every word (1 interaction per minute)',
						action: 'Transcribe a recording',
					},
				],
				default: 'transcribe',
			},
			{
				displayName: 'Input Data Field Name',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: { show: { resource: ['audio'], operation: ['transcribe'] } },
				default: 'data',
				required: true,
				hint: 'The name of the input binary field with the audio (mp3, mp4, m4a, wav, webm or ogg; up to 25 MB and 30 minutes)',
			},
			{
				displayName: 'Options',
				name: 'transcribeOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: { show: { resource: ['audio'], operation: ['transcribe'] } },
				default: {},
				options: [
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: '',
						placeholder: 'pt',
						description: 'The language of the audio, as two letters. Leave empty to detect it.',
					},
					{
						displayName: 'Word Times',
						name: 'words',
						type: 'boolean',
						default: true,
						description: 'Whether to return the start and the end of every word (for subtitles)',
					},
				],
			},
			{
				displayName: 'Text',
				name: 'input',
				type: 'string',
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['audio'], operation: ['speech'] } },
				default: '',
				required: true,
				description: 'The text to read aloud, up to 4000 characters',
			},
			{
				displayName: 'Put Output File in Field',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: { show: { resource: ['audio'], operation: ['speech'] } },
				default: 'data',
				required: true,
				hint: 'The name of the output binary field to put the mp3 in',
			},
			{
				displayName: 'Options',
				name: 'speechOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: { show: { resource: ['audio'], operation: ['speech'] } },
				default: {},
				options: [
					{
						displayName: 'Speed',
						name: 'speed',
						type: 'number',
						typeOptions: { minValue: 0.7, maxValue: 1.2, numberPrecision: 2 },
						default: 1,
						description: 'How fast the voice speaks, from 0.7 to 1.2',
					},
					{
						displayName: 'Word Times',
						name: 'timestamps',
						type: 'boolean',
						default: false,
						description: 'Whether to return the start and the end of every word as well',
					},
				],
			},

			// ------------------------------------------------------------ conversation
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				displayOptions: { show: { resource: ['conversation'], operation: ['get'] } },
				default: '',
				required: true,
				description: 'The ID of the conversation',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				displayOptions: { show: { resource: ['conversation'], operation: ['getAll'] } },
				default: 50,
				description: 'Max number of results to return',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let response: IDataObject | IDataObject[] = {};

				if (resource === 'model' && operation === 'message') {
					const systemPrompt = this.getNodeParameter('systemPrompt', i, '') as string;
					const options = this.getNodeParameter('modelOptions', i, {}) as IDataObject;
					const messages: IDataObject[] = [];
					if (systemPrompt.trim()) {
						messages.push({ role: 'system', content: systemPrompt });
					}
					messages.push({ role: 'user', content: this.getNodeParameter('message', i) as string });
					const body: IDataObject = {
						model: this.getNodeParameter('model', i) as string,
						messages,
					};
					if (options.temperature !== undefined) body.temperature = options.temperature;
					if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
					if (options.jsonOutput === true) body.response_format = { type: 'json_object' };
					const reply = await oryksaRequest.call(this, 'POST', '/chat/completions', body);
					const choice = ((reply.choices as IDataObject[]) ?? [])[0] ?? {};
					const message = (choice.message as IDataObject) ?? {};
					response = {
						content: message.content ?? '',
						finish_reason: choice.finish_reason,
						model: reply.model,
						usage: reply.usage,
						oryksa: reply.oryksa,
					};
				} else if (resource === 'assistant' && (operation === 'ask' || operation === 'do')) {
					const options = this.getNodeParameter('assistantOptions', i, {}) as IDataObject;
					const body = compact({
						mode: operation,
						message: this.getNodeParameter('message', i) as string,
						input: this.getNodeParameter('input', i, '') as string,
						conversation_id: options.conversationId,
						lang: options.lang,
					});
					if (options.newConversation === true) body.new_conversation = true;
					if (operation === 'do' && options.image === true) body.image = true;
					response = await oryksaRequest.call(this, 'POST', '/assistant', body);
				} else if (resource === 'image' && operation === 'create') {
					const created = await oryksaRequest.call(this, 'POST', '/images/generations', {
						prompt: this.getNodeParameter('prompt', i) as string,
						size: this.getNodeParameter('size', i) as string,
					});
					const picture = ((created.data as IDataObject[]) ?? [])[0] ?? {};
					response = { url: picture.url, usage: created.oryksa };
					if (this.getNodeParameter('download', i, true) as boolean) {
						const field = this.getNodeParameter('binaryPropertyName', i) as string;
						const file = (await this.helpers.httpRequest({
							method: 'GET',
							url: String(picture.url),
							encoding: 'arraybuffer',
						})) as ArrayBuffer;
						const binary = await this.helpers.prepareBinaryData(Buffer.from(file), 'oryksa.png', 'image/png');
						returnData.push({ json: response, binary: { [field]: binary }, pairedItem: { item: i } });
						continue;
					}
				} else if (resource === 'audio' && operation === 'transcribe') {
					const field = this.getNodeParameter('binaryPropertyName', i) as string;
					const options = this.getNodeParameter('transcribeOptions', i, {}) as IDataObject;
					const meta = this.helpers.assertBinaryData(i, field);
					const audio = await this.helpers.getBinaryDataBuffer(i, field);
					const form = new FormData();
					form.append('file', new Blob([audio], { type: meta.mimeType }), meta.fileName ?? 'audio');
					form.append('response_format', options.words === false ? 'json' : 'verbose_json');
					if (options.language) form.append('language', String(options.language));
					response = await oryksaUpload.call(this, '/audio/transcriptions', form);
				} else if (resource === 'audio' && operation === 'speech') {
					const field = this.getNodeParameter('binaryPropertyName', i) as string;
					const options = this.getNodeParameter('speechOptions', i, {}) as IDataObject;
					const spoken = await oryksaRequest.call(
						this,
						'POST',
						'/audio/speech',
						compact({
							input: this.getNodeParameter('input', i) as string,
							voice: 'default',
							speed: options.speed,
							timestamps: true,
						}),
					);
					const binary = await this.helpers.prepareBinaryData(
						Buffer.from(String(spoken.audio_base64 ?? ''), 'base64'),
						'oryksa.mp3',
						'audio/mpeg',
					);
					response = options.timestamps === true ? { words: spoken.words, usage: spoken.oryksa } : { usage: spoken.oryksa };
					returnData.push({ json: response, binary: { [field]: binary }, pairedItem: { item: i } });
					continue;
				} else if (resource === 'assistant' && operation === 'approve') {
					response = await oryksaRequest.call(this, 'POST', '/assistant', {
						approve: this.getNodeParameter('approvalId', i) as string,
					});
				} else if (resource === 'customerAgent' && operation === 'sendMessage') {
					const options = this.getNodeParameter('agentOptions', i, {}) as IDataObject;
					response = await oryksaRequest.call(
						this,
						'POST',
						'/chat',
						compact({
							message: this.getNodeParameter('message', i) as string,
							conversation_id: options.conversationId,
							customer_name: options.customerName,
						}),
					);
				} else if (resource === 'knowledge' && operation === 'get') {
					response = await oryksaRequest.call(this, 'GET', '/knowledge');
				} else if (resource === 'knowledge' && operation === 'addFaq') {
					response = await oryksaRequest.call(this, 'POST', '/knowledge/faq', {
						items: [
							{
								question: this.getNodeParameter('question', i) as string,
								answer: this.getNodeParameter('answer', i) as string,
							},
						],
					});
				} else if (resource === 'knowledge' && operation === 'crawl') {
					response = await oryksaRequest.call(this, 'POST', '/knowledge/crawl', {
						url: this.getNodeParameter('url', i) as string,
						max_pages: this.getNodeParameter('maxPages', i, 20) as number,
					});
				} else if (resource === 'conversation' && operation === 'get') {
					const id = encodeURIComponent(this.getNodeParameter('conversationId', i) as string);
					response = await oryksaRequest.call(this, 'GET', `/conversations/${id}`);
				} else if (resource === 'conversation' && operation === 'getAll') {
					const reply = await oryksaRequest.call(this, 'GET', '/conversations', undefined, {
						limit: this.getNodeParameter('limit', i, 50) as number,
					});
					response = (reply.data as IDataObject[]) ?? [];
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for "${resource}"`,
						{ itemIndex: i },
					);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(response),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				if ((error as IDataObject).httpCode || (error as IDataObject).response) {
					// an answer of the ORYKSA API (401, 402, 429...): n8n shows its status and its message
					throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
