export class ExtendedSet<T> extends Set<T> {
	any = (...values: T[]): boolean => {
		for (var curr of values) {
			if (this.has(curr)) return true;
		}
		return false;
	};
}