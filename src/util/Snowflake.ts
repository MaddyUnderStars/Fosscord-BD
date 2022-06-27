export const findIds = (obj: any, depth = 5): string[] => {
	if (depth == 0) return [];

	var ret: string[] = [];
	for (var [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object")
			ret = ret.concat(findIds(value, depth - 1));

		// bad way of checking if it looks like a proper snowflake
		if (!value || value == "null" || value == "undefined") continue;
		if (!Number(value)) continue;

		const index = key.toLowerCase().indexOf("id");
		if (index == -1) continue;
		if (index != key.length - 2) continue;
		// if (key.toLowerCase().indexOf("_id") == -1	// bad detection algo lets gooo
			// && key.toLowerCase().indexOf("id") != key.length - 2
			// && key.length - 2 != -1)
			// continue;

		// console.log(`Fosscord controls ID ${key}:${value}`);
		ret.push(value as string);
	}
	return ret;
};