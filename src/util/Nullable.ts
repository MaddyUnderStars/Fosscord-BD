// stolen from https://typeofnan.dev/making-every-object-property-nullable-in-typescript/
export type Nullable<T> = { [K in keyof T]: T[K] | null };