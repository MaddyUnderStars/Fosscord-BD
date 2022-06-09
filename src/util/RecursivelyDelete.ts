// Fosscord often sends null/undefined values which the client doesn't enjoy
const recursiveDelete = (obj: any) => {
	for (let key in obj) {
		if (obj[key] && typeof obj[key] === "object")
			obj[key] = recursiveDelete(obj[key]);

		if (obj[key] == null) delete obj[key];
	}

	return obj;
};

export default recursiveDelete;