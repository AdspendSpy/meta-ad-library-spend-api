import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type Context = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IWebhookFunctions;

export const CREDENTIAL_NAME = 'adSpendSpyApi';

export async function adSpendSpyApiRequest(
	this: Context,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials(CREDENTIAL_NAME);
	const baseUrl = String(credentials.baseUrl || 'https://www.adspendspy.com').replace(/\/+$/, '');
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/v1/${path}`,
		json: true,
		headers: { Accept: 'application/json' },
	};
	if (body !== undefined) {
		options.body = body;
	}
	if (qs !== undefined) {
		options.qs = qs;
	}
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			CREDENTIAL_NAME,
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/** Follows pagination.next_cursor of the polling endpoints (docs/AUTOMATIONS.md, section 5). */
export async function adSpendSpyApiRequestItems(
	this: IExecuteFunctions,
	path: string,
	qs: IDataObject,
	returnAll: boolean,
	limit: number,
): Promise<IDataObject[]> {
	const items: IDataObject[] = [];
	const query: IDataObject = { ...qs, limit: returnAll ? 100 : Math.min(Math.max(limit, 1), 100) };
	for (;;) {
		const response = await adSpendSpyApiRequest.call(this, 'GET', path, undefined, query);
		const page = (response.items as IDataObject[] | undefined) ?? [];
		items.push(...page);
		const pagination = (response.pagination as IDataObject | undefined) ?? {};
		const nextCursor = pagination.next_cursor as string | undefined;
		if (!returnAll && items.length >= limit) {
			return items.slice(0, limit);
		}
		if (!pagination.has_more || !nextCursor || page.length === 0) {
			return items;
		}
		query.cursor = nextCursor;
		delete query.since_id;
	}
}

export async function getTrackedBrands(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const response = await adSpendSpyApiRequest.call(this, 'GET', 'brands/list.php');
	const brands = (response.data as IDataObject[] | undefined) ?? [];
	return brands
		.map((brand) => ({
			name: String(brand.brand_name || brand.page_id),
			value: String(brand.page_id),
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await adSpendSpyApiRequest.call(this, 'GET', 'projects/get.php');
	const projects = (response.projects as IDataObject[] | undefined) ?? [];
	return projects.map((project) => ({
		name: String(project.project_name || project.public_id),
		value: String(project.public_id),
	}));
}
