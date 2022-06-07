export const findIds = (obj: any, depth = 5): string[] => {
	if (depth == 0) return [];

	var ret: string[] = [];
	for (var [key, value] of Object.entries(obj)) {
		if (value && typeof value === "object")
			ret = ret.concat(findIds(value, depth - 1));

		if (key.toLowerCase().indexOf("_id") == -1	// bad detection algo lets gooo
			&& key.toLowerCase().indexOf("id") != key.length - 2)
			continue;
		if (!value || value == "null" || value == "undefined") continue;
		// bad way of checking if it looks like a proper snowflake
		if (!Number(value)) continue;

		// Log.msg(`Fosscord controls ID ${value}`);
		ret.push(value as string);
	}
	return ret;
};