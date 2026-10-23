import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import { adSpendSpyApiRequest, getProjects, getTrackedBrands } from '../shared/transport';
import { verifySignature } from './signature';

interface TriggerStaticData extends IDataObject {
	webhookId?: string;
	webhookSecret?: string;
}

function isNotFound(error: unknown): boolean {
	const candidate = error as { httpCode?: string | number; cause?: { status?: number } };
	return String(candidate?.httpCode ?? candidate?.cause?.status ?? '') === '404';
}

function headerValue(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[0] : value;
}

export class AdSpendSpyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AdSpendSpy Trigger',
		name: 'adSpendSpyTrigger',
		icon: { light: 'file:../../icons/adspendspy.svg', dark: 'file:../../icons/adspendspy.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow on new ads and spend alerts of the brands you track',
		defaults: {
			name: 'AdSpendSpy Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'adSpendSpyApi',
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
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'ad.new',
				options: [
					{
						name: 'New Ad From Tracked Brand',
						value: 'ad.new',
						description: 'A brand you track starts a new ad',
					},
					{
						name: 'New Spend Alert',
						value: 'ad.spend_alert',
						description: 'An ad of a brand you track passes your spend alert threshold',
					},
				],
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'options',
				default: 'none',
				options: [
					{ name: 'All Tracked Brands', value: 'none' },
					{ name: 'One Brand', value: 'brand' },
					{ name: 'One Project', value: 'project' },
				],
			},
			{
				displayName: 'Brand Name or ID',
				name: 'pageId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTrackedBrands' },
				required: true,
				default: '',
				description:
					'Tracked brand (Facebook page ID). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: { show: { filter: ['brand'] } },
			},
			{
				displayName: 'Project Name or ID',
				name: 'project',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getProjects' },
				required: true,
				default: '',
				description:
					'Project of tracked brands. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: { show: { filter: ['project'] } },
			},
		],
	};

	methods = {
		loadOptions: {
			getTrackedBrands,
			getProjects,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				if (!staticData.webhookId) {
					return false;
				}
				const response = await adSpendSpyApiRequest.call(this, 'GET', 'webhooks/list.php');
				const webhooks = (response.webhooks as IDataObject[] | undefined) ?? [];
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const found = webhooks.some(
					(webhook) =>
						webhook.id === staticData.webhookId &&
						webhook.target_url === webhookUrl &&
						webhook.event === event,
				);
				if (!found) {
					delete staticData.webhookId;
					delete staticData.webhookSecret;
				}
				return found;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				const filter = this.getNodeParameter('filter', 'none') as string;
				const body: IDataObject = {
					event: this.getNodeParameter('event') as string,
					target_url: this.getNodeWebhookUrl('default'),
					platform: 'n8n',
					page_id: filter === 'brand' ? (this.getNodeParameter('pageId') as string) : null,
					project: filter === 'project' ? (this.getNodeParameter('project') as string) : null,
				};
				const response = await adSpendSpyApiRequest.call(this, 'POST', 'webhooks/subscribe.php', body);
				const webhook = response.webhook as IDataObject | undefined;
				if (!webhook?.id || typeof response.secret !== 'string') {
					return false;
				}
				staticData.webhookId = String(webhook.id);
				staticData.webhookSecret = response.secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
				if (staticData.webhookId) {
					try {
						await adSpendSpyApiRequest.call(this, 'POST', 'webhooks/unsubscribe.php', {
							id: staticData.webhookId,
						});
					} catch (error) {
						if (!isNotFound(error)) {
							throw new NodeApiError(this.getNode(), error as JsonObject);
						}
					}
				}
				delete staticData.webhookId;
				delete staticData.webhookSecret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const staticData = this.getWorkflowStaticData('node') as TriggerStaticData;
		const request = this.getRequestObject() as ReturnType<IWebhookFunctions['getRequestObject']> & {
			rawBody?: Buffer;
		};
		const headers = this.getHeaderData() as Record<string, string | string[] | undefined>;
		const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(request.body);
		const valid = verifySignature({
			secret: staticData.webhookSecret ?? '',
			timestamp: headerValue(headers['x-adspendspy-timestamp']),
			signature: headerValue(headers['x-adspendspy-signature']),
			rawBody,
		});
		if (!valid) {
			const response = this.getResponseObject();
			response.status(401).json({ success: false, message: 'Invalid signature' });
			return { noWebhookResponse: true };
		}
		const body = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
