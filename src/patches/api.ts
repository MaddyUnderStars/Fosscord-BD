import { patcher, webpack } from "ittai";
import FosscordPlugin from "..";
import { APIRequest, HttpClient } from "../client/HttpClient";

export default function (this: FosscordPlugin) {
	const redirectRequest = (method: string, request: APIRequest) => {
		const {
			url,
			body,
			query,
		} = typeof request == "string" ? { url: request, body: undefined, query: undefined } : request;

		// this is dumb
		const IdsInRequest = [
			...(url || "").split("/").filter(x => !isNaN(parseInt(x))),
			...Object.values(body || {}).filter(x => !isNaN(parseInt(x))).flat(),
			...Object.values(query || {}).filter(x => !isNaN(parseInt(x))).flat(),
		];

		const client = this.findControllingClient(IdsInRequest);
		if (!client) {
			return null;
		}

		if (url.indexOf("/ack") != -1) {
			client.log(`Preventing request to /ack, not implemented in server`);
			return null;
		}

		return HttpClient.send(client, method, client.instance?.apiUrl + url, body, query);
	};

	for (let method of [
		"get",
		"post",
		"patch",
		"put",
		// "options",
		"delete",
	]) {
		patcher.instead(
			"fosscord",
			webpack.findByProps("getAPIBaseURL"),
			method,
			async (args: any[], original: any) => {
				const promise = redirectRequest(method, args[0]);
				if (!promise) return original(...args);

				const ret = await promise;
				if (args[1]) args[1](ret);

				return ret;
			}
		);
	}
}