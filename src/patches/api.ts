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
			client.debug(`Preventing request to /ack, not implemented in server`);
			return null;
		}

		return HttpClient.send({
			client,
			method,
			path: client.instance?.apiUrl + url,
			body,
			query
		});
	};

	// TODO: It would be a nicer solution to just patch XMLHttpRequest instead
	// However, on launch Discord seems to store a copy of XMLHttpRequest.prototype, and uses that instead
	// Would this prevent me from patching it? I can't load before they store this
	// It would be fine if for some reason the variable is actually a reference
	// But I haven't tested yet

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

	// not the function I want
	// I need some way to patch the module containing getXHR
	// OR the frozen list functions that return API routes
	// which I can't patch
	// patcher.instead(
	// 	"fosscord",
	// 	webpack.findByProps("MultiUploader").MultiUploader.prototype,
	// 	"uploadFiles",
	// 	function(this: any, args, original) {
	// 		console.log(args, this);
	// 		return original(...args);
	// 	}
	// )
}