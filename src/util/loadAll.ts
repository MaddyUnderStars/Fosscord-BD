export default function loadAll(context: any) {
	const ret: any = {};
	context.keys().forEach((x: string) => ret[x] = context(x));
	delete ret["./index.ts"];
	return Object.values(ret).map((x: any) => x.default);
}