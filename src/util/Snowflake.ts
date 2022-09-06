export const findIds = (obj: any, depth = 5): string[] => {
	if (depth == 0) return [];

	var ret: string[] = [];
	for (var [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object")
			ret = ret.concat(findIds(value, depth - 1));

		if (value && !(value as any).toString) {
			// prevent objects will null prototype from throwing when we convert to string later
			continue;
		}
		// bad way of checking if it looks like a proper snowflake
		if (!value
			|| value == "null"
			|| value == "undefined"
			|| typeof value == "symbol"
		)
			continue;
		if (!Number(value)) continue;

		const index = key.toLowerCase().indexOf("id");
		if (index == -1) continue;
		if (index != key.length - 2) continue;

		ret.push(value as string);
	}
	return ret;
};