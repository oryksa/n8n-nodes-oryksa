import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OryksaApi implements ICredentialType {
	name = 'oryksaApi';

	displayName = 'ORYKSA API';

	icon: Icon = { light: 'file:../icons/oryksa.svg', dark: 'file:../icons/oryksa.svg' };

	documentationUrl = 'https://developer.oryksa.com/en/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'oryk_live_...',
			description:
				'Your ORYKSA API key. Create one at developer.oryksa.com, on the API keys page. It starts with oryk_live_.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.oryksa.com/v1',
			url: '/account',
			method: 'GET',
		},
	};
}
