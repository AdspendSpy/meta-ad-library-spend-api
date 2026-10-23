import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AdSpendSpyApi implements ICredentialType {
	name = 'adSpendSpyApi';

	displayName = 'AdSpendSpy API';

	icon: Icon = { light: 'file:../icons/adspendspy.svg', dark: 'file:../icons/adspendspy.dark.svg' };

	documentationUrl =
		'https://github.com/adspendspy/meta-ad-library-spend-api/tree/main/integrations/n8n#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your AdSpendSpy API key (starts with asp_live_). Create it under Account Settings → API Keys.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://www.adspendspy.com',
			description: 'Change only for local testing',
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
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/brands/list.php',
			method: 'GET',
		},
	};
}
