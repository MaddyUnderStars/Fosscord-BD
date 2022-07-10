import { settings } from "ittai";

export const isId = (id: any, key?: string) => {
	if (id && !(id as any).toString) {
		// prevent objects will null prototype from throwing when we convert to string later
		return false;
	}
	// bad way of checking if it looks like a proper snowflake
	if (!id || id == "null" || id == "undefined") return false;
	if (!Number(id)) return false;

	if (key) {
		const index = key.toLowerCase().indexOf("id");
		if (index == -1) return false;
		if (index != key.length - 2) return false;
	}

	return true;
};

export const findIds = (obj: any, depth = 5): string[] => {
	if (depth == 0) return [];

	var ret: string[] = [];
	for (var [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object")
			ret = ret.concat(findIds(value, depth - 1));

		if (!isId(value, key)) continue;

		ret.push(value as string);
	}
	return ret;
};

export const redirectIds = (obj: any, depth = 5): any => {
	if (depth == 0) return obj;

	const redirectedIds = settings.get("redirectedIds", {});
	if (!Object.keys(redirectedIds).length) return obj;

	for (var key in obj) {
		if (obj[key] && typeof obj[key] === "object")
			obj[key] = redirectIds(obj[key], depth - 1);

		if (!isId(obj[key])) continue;

		const redirection = redirectedIds[obj[key]];
		if (!redirection) continue;

		obj[key] = redirection;
	}

	return obj;
};