export class Collection<T> extends Map<string, T> {
	// TODO: Might be useful to add methods similar to discord.js's here?

	find = (fn: (value: T, key: string, collection: this) => any) => {
		for (var [id, value] of this) {
			if (fn(value, id, this))
				return this.get(id);
		}
	};
}

export class ExtendedSet<T> extends Set<T> {
	any = (...values: T[]): boolean => {
		for (var curr of values) {
			if (this.has(curr)) return true;
		}
		return false;
	};
}