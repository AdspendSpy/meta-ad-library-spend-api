import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	adSpendSpyApiRequest,
	adSpendSpyApiRequestItems,
	getProjects,
	getTrackedBrands,
} from '../shared/transport';

function pollingFields(resource: string, operation: string, idLabel: string): INodeProperties[] {
	const show = { resource: [resource], operation: [operation] };
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
		},
		{
			displayName: 'Filters',
			name: 'filters',
			type: 'collection',
			placeholder: 'Add Filter',
			default: {},
			displayOptions: { show },
			options: [
				{
					displayName: 'Brand Name or ID',
					name: 'pageId',
					type: 'options',
					typeOptions: { loadOptionsMethod: 'getTrackedBrands' },
					default: '',
					description:
						'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				},
				{
					displayName: 'Project Name or ID',
					name: 'project',
					type: 'options',
					typeOptions: { loadOptionsMethod: 'getProjects' },
					default: '',
					description:
						'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				},
				{
					displayName: 'Since ID',
					name: 'sinceId',
					type: 'number',
					typeOptions: { minValue: 0 },
					default: 0,
					description: `Only items with a higher ${idLabel}. 0 returns the last 30 days.`,
				},
			],
		},
	];
}

export class AdSpendSpy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AdSpendSpy',
		name: 'adSpendSpy',
		icon: { light: 'file:../../icons/adspendspy.svg', dark: 'file:../../icons/adspendspy.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Track brands and read new ads and spend alerts with the AdSpendSpy API',
		defaults: {
			name: 'AdSpendSpy',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'adSpendSpyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'brand',
				options: [
					{ name: 'Ad', value: 'ad' },
					{ name: 'Alert', value: 'alert' },
					{ name: 'Brand', value: 'brand' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['brand'] } },
				default: 'track',
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'List the brands you track',
						action: 'Get many tracked brands',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search the brands you track by name, page ID or Facebook URL',
						action: 'Search tracked brands',
					},
					{
						name: 'Track',
						value: 'track',
						description: 'Start tracking a brand by its Facebook page ID',
						action: 'Track a brand',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['ad'] } },
				default: 'getManyNew',
				options: [
					{
						name: 'Get Many New',
						value: 'getManyNew',
						description: 'List new ads of the brands you track',
						action: 'Get many new ads',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['alert'] } },
				default: 'getAll',
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'List spend alerts of the brands you track',
						action: 'Get many spend alerts',
					},
				],
			},
			{
				displayName: 'Page ID',
				name: 'pageId',
				type: 'string',
				required: true,
				default: '',
				placeholder: '116482854782233',
				description: 'Facebook page ID of the brand',
				displayOptions: { show: { resource: ['brand'], operation: ['track'] } },
			},
			{
				displayName: 'Brand Name',
				name: 'brandName',
				type: 'string',
				required: true,
				default: '',
				description: 'Display name of the brand',
				displayOptions: { show: { resource: ['brand'], operation: ['track'] } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				description: 'Brand name, Facebook page ID or Facebook page URL',
				displayOptions: { show: { resource: ['brand'], operation: ['search'] } },
			},
			{
				displayName: 'Project Name or ID',
				name: 'project',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getProjects' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: { show: { resource: ['brand'], operation: ['getAll'] } },
			},
			...pollingFields('ad', 'getManyNew', 'internal ad ID'),
			...pollingFields('alert', 'getAll', 'alert ID'),
		],
	};

	methods = {
		loadOptions: {
			getTrackedBrands,
			getProjects,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				let results: IDataObject[] = [];

				if (resource === 'brand' && operation === 'track') {
					const response = await adSpendSpyApiRequest.call(this, 'POST', 'brands/track.php', {
						page_id: (this.getNodeParameter('pageId', itemIndex) as string).trim(),
						brand_name: (this.getNodeParameter('brandName', itemIndex) as string).trim(),
					});
					results = [response];
				} else if (resource === 'brand' && operation === 'search') {
					const response = await adSpendSpyApiRequest.call(
						this,
						'GET',
						'brands/search-tracked.php',
						undefined,
						{ q: this.getNodeParameter('query', itemIndex) as string },
					);
					results = (response.results as IDataObject[] | undefined) ?? [];
				} else if (resource === 'brand' && operation === 'getAll') {
					const project = this.getNodeParameter('project', itemIndex, '') as string;
					const response = await adSpendSpyApiRequest.call(
						this,
						'GET',
						'brands/list.php',
						undefined,
						project ? { project } : {},
					);
					results = (response.data as IDataObject[] | undefined) ?? [];
				} else if (
					(resource === 'ad' && operation === 'getManyNew') ||
					(resource === 'alert' && operation === 'getAll')
				) {
					const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
					if (filters.pageId && filters.project) {
						throw new NodeOperationError(this.getNode(), 'Use either Brand or Project, not both', {
							itemIndex,
						});
					}
					const qs: IDataObject = {};
					if (filters.pageId) qs.page_id = filters.pageId;
					if (filters.project) qs.project = filters.project;
					if (Number(filters.sinceId) > 0) qs.since_id = Number(filters.sinceId);
					const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
					const limit = returnAll ? 0 : (this.getNodeParameter('limit', itemIndex, 50) as number);
					results = await adSpendSpyApiRequestItems.call(
						this,
						resource === 'ad' ? 'ads/new.php' : 'alerts/list.php',
						qs,
						returnAll,
						limit,
					);
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported operation "${operation}" for resource "${resource}"`,
						{ itemIndex },
					);
				}

				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
