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
	body: { [key: string]: any; } | null,
	headers: { [key: string]: any; },
	ok: boolean,
	status: number,
	text: string,
}

export class HttpClient {
	static send = async (client: Client, method: string, path: string, body: any = undefined, query: any = undefined): Promise<APIResponse> => {
		if (query) {
			query = recursiveDelete(query); // can't have undef methods in here
			path += "?" + new URLSearchParams(query).toString();
		}

		const fetched = await fetch(
			path,
			{
				method: method.toUpperCase(),
				headers: {
					"Authorization": client.instance!.token!,
					"Content-Type": "application/json"
				},
				body: body ? JSON.stringify(body) : undefined,
			}
		);

		const parsedBody = await fetched.json();

		const ret = {
			body: parsedBody,
			text: JSON.stringify(parsedBody),
			status: fetched.status,
			ok: fetched.status == 200,
			headers: fetched.headers,
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