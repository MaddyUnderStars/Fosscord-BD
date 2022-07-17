import { logger } from "ittai";
import recursiveDelete from "../util/RecursivelyDelete";
import { findIds } from "../util/Snowflake";
import { Client } from "./Client";

export interface APIRequest {
	url: string,
	body: { [key: string]: any; },
	query: { [key: string]: any; },
	retries: number,
	oldFormErrors?: boolean,
};

export interface APIResponse {
	body: any,
	headers: { [key: string]: any; },
	ok: boolean,
	status: number,
	text: string,
}

export interface HttpClientSendOptions {
	client?: Client,
	query?: { [key: string]: any; },
	body?: { [key: string]: any; },
	path: string,
	method: string,
}

export class HttpClient {
	static send = async (options: HttpClientSendOptions): Promise<APIResponse> => {
		let {
			client,
			query,
			body,
			path,
			method
		} = options;

		if (query) {
			query = recursiveDelete(query); // can't have undef methods in here
			path += "?" + new URLSearchParams(query).toString();
		}

		const headers: any = {
			"Content-Type": "application/json"
		};
		if (client) headers["Authorization"] = client!.instance!.token;

		const tryFetch = async () => {
			try {
				console.log(path);
				return await fetch(
					path,
					{
						method: method.toUpperCase(),
						headers: headers,
						body: body ? JSON.stringify(body) : undefined,
						cache: path.indexOf("/api") == -1 ? 'no-cache' : 'force-cache',
					}
				);
			}
			catch (e) {
				logger.error(`Failed to fetch ${path}, reason`, e);
				return null;
			}

		};

		const fetched = await tryFetch();
		if (!fetched) return { body: {}, text: "", status: 500, ok: false, headers: {} };

		var parsedBody;
		try {
			parsedBody = await fetched.json()
		}
		catch (e) {
			console.error(e);
			parsedBody = {};
		}

		if (client)
			for (let id of findIds(parsedBody))
				client.controlledIds.add(id);

		const headersObj: any = {};
		for (const key in fetched.headers) {
			headersObj[key.toLowerCase()] = fetched.headers.get(key);
		}

		const ret = {
			body: parsedBody,
			text: JSON.stringify(parsedBody),
			status: fetched.status,
			ok: fetched.status >= 200 && fetched.status < 300,
			headers: headersObj,
		};

		if (!ret.ok) throw ret;

		return ret;

		/*

		const xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = () => {
			if (xhttp.readyState !== 4) return;
			if (xhttp.status !== 200) reject(`Could not ${method} ${path}`);

			const headers: { [key: string]: string; } = {};
			xhttp.getAllResponseHeaders()
				.split(/[\r\n]+/)
				.forEach(x => {
					const parts = x.split(": ");
					const header = parts.shift();
					if (!header) return;
					headers[header] = parts.join(": ");
				});

			var json: { [key: string]: any; } | null = null;
			try {
				if (xhttp.responseText) {
					json = JSON.parse(xhttp.responseText);

					for (let id of findIds(json))
						client.controlledIds.add(id);
				}
			}
			catch (e) {
				return reject(e);
			}

			resolve({
				body: json,
				status: xhttp.status,
				text: xhttp.responseText,
				ok: xhttp.status == 200,
				headers: headers,
			});
		};

		if (query) {
			query = recursiveDelete(query); // can't have undef methods in here
			path += "?" + new URLSearchParams(query).toString();
		}

		xhttp.open(method, path, true);
		xhttp.setRequestHeader("Authorization", client.instance!.token as string);
		xhttp.setRequestHeader("Content-Type", "application/json");
		xhttp.send(JSON.stringify(body));

		*/
	};
}