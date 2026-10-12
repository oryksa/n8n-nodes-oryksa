import { createHmac, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { oryksaRequest } from './GenericFunctions';

/** A signature older than this is refused, so a captured request cannot be replayed later. */
const TOLERANCE_SECONDS = 300;

/**
 * ORYKSA signs every event: ORYKSA-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<raw body>")>.
 */
function signatureIsValid(header: string, rawBody: string, secret: string): boolean {
	const parts: IDataObject = {};
	for (const piece of header.split(',')) {
		const index = piece.indexOf('=');
		if (index > 0) {
			parts[piece.slice(0, index).trim()] = piece.slice(index + 1).trim();
		}
	}
	const timestamp = Number(parts.t);
	const given = String(parts.v1 ?? '');
	if (!Number.isFinite(timestamp) || !/^[0-9a-f]{64}$/.test(given)) {
		return false;
	}
	if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) {
		return false;
	}
	const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
	return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(given, 'hex'));
}

export class OryksaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ORYKSA Trigger',
		name: 'oryksaTrigger',
		icon: { light: 'file:../../icons/oryksa.svg', dark: 'file:../../icons/oryksa.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when something happens in your ORYKSA account',
		defaults: {
			name: 'ORYKSA Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'oryksaApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['message.replied'],
				description: 'The events that start this workflow',
				options: [
					{
						name: 'Booking Created',
						value: 'booking.created',
						description: 'A customer booked a time with your agent',
					},
					{
						name: 'Knowledge Updated',
						value: 'knowledge.updated',
						description: 'What your agent knows was changed',
					},
					{
						name: 'Limit Reached',
						value: 'limit.reached',
						description: 'The interactions of your plan ran out for this period',
					},
					{
						name: 'Message Replied',
						value: 'message.replied',
						description: 'Your agent replied to a customer',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (!staticData.webhookId) {
					return false;
				}
				const url = this.getNodeWebhookUrl('default');
				const reply = await oryksaRequest.call(this, 'GET', '/webhooks');
				const hooks = (reply.data as IDataObject[]) ?? [];
				const found = hooks.some((hook) => hook.id === staticData.webhookId && hook.url === url);
				if (!found) {
					delete staticData.webhookId;
					delete staticData.webhookSecret;
				}
				return found;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const url = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', []) as string[];
				const reply = await oryksaRequest.call(this, 'POST', '/webhooks', { url, events });
				if (!reply.id || !reply.secret) {
					return false;
				}
				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookId = reply.id;
				staticData.webhookSecret = reply.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (!staticData.webhookId) {
					return true;
				}
				try {
					const id = encodeURIComponent(String(staticData.webhookId));
					await oryksaRequest.call(this, 'DELETE', `/webhooks/${id}`);
				} catch (error) {
					// the webhook stays registered in ORYKSA: said in the log, and n8n is told it was not removed
					this.logger.warn(`ORYKSA Trigger: the webhook could not be removed (${(error as Error).message})`);
					return false;
				}
				delete staticData.webhookId;
				delete staticData.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const request = this.getRequestObject();
		const response = this.getResponseObject();
		const staticData = this.getWorkflowStaticData('node');
		const secret = String(staticData.webhookSecret ?? '');
		const header = String(this.getHeaderData()['oryksa-signature'] ?? '');
		const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(request.body);

		if (!secret || !header || !signatureIsValid(header, rawBody, secret)) {
			response.status(401).json({ error: 'invalid signature' });
			return { noWebhookResponse: true };
		}

		const event = this.getBodyData() as IDataObject;
		const wanted = this.getNodeParameter('events', []) as string[];
		if (event.type !== 'webhook.test' && !wanted.includes(String(event.type))) {
			return { webhookResponse: { ok: true, ignored: true } };
		}

		return {
			workflowData: [this.helpers.returnJsonArray(event)],
		};
	}
}
