import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

export const ORYKSA_API = 'https://api.oryksa.com/v1';

/**
 * One request to the ORYKSA API with the credential of the node.
 * The API key is added by the credential itself (Authorization: Bearer ...).
 */
export async function oryksaRequest(
	this: IExecuteFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${ORYKSA_API}${path}`,
		headers: sourceHeaders.call(this),
		json: true,
	};
	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}
	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}
	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'oryksaApi',
		options,
	)) as IDataObject;
}

/** A file sent to the ORYKSA API (multipart/form-data), with the credential of the node. */
export async function oryksaUpload(
	this: IExecuteFunctions,
	path: string,
	form: FormData,
): Promise<IDataObject> {
	return (await this.helpers.httpRequestWithAuthentication.call(this, 'oryksaApi', {
		method: 'POST',
		url: `${ORYKSA_API}${path}`,
		headers: sourceHeaders.call(this),
		body: form,
	})) as IDataObject;
}

/**
 * Says where the request comes from, so the usage statement of the ORYKSA account shows "n8n" and the name of the
 * workflow, and groups the interactions by workflow. It is only a label: it gives no permission and changes no price.
 * The name is URL-encoded because a header cannot carry characters outside ASCII.
 */
export function sourceHeaders(this: IExecuteFunctions | IHookFunctions): IDataObject {
	const headers: IDataObject = { 'X-Oryksa-Source': 'n8n' };
	try {
		const workflow = this.getWorkflow();
		if (workflow.name) {
			headers['X-Oryksa-Workflow'] = encodeURIComponent(String(workflow.name).slice(0, 120));
		}
		if (workflow.id) {
			headers['X-Oryksa-Workflow-Id'] = String(workflow.id);
		}
		const executionId = 'getExecutionId' in this ? this.getExecutionId() : undefined;
		if (executionId) {
			headers['X-Oryksa-Execution-Id'] = String(executionId);
		}
	} catch {
		// the label is optional: a request never fails because of it
	}
	return headers;
}

/** Removes the keys that carry no value, so optional fields are simply not sent. */
export function compact(input: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const key of Object.keys(input)) {
		const value = input[key];
		if (value !== undefined && value !== null && value !== '') {
			out[key] = value;
		}
	}
	return out;
}
