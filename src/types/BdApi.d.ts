type ReactInstance = typeof React
type ReactDOMInstance = typeof ReactDOM

declare module BdApi {
	export const React: ReactInstance
	export const ReactDOM: ReactDOMInstance

	export function alert(title: string, content: string): void
	export function clearCSS(id: string): void
	export function deleteData(pluginName: string, key: string): void
	export function findModule(filter: () => void): any | null
	export function findAllModules(filter: () => void): any[]
	export function findModuleByProps(...props: string[]): any | null
	export function getCore(): object
	export function getData(pluginName: string, key: string): any | null
	export function getInternalInstance(node: HTMLElement): object | undefined
	export function getPlugin(name: string): object | null
	export function injectCSS(id: string, css: string): object | null
	export function linkJS(id: string, url: string): void
	export function loadData(pluginName: string, key: string): any | null
	export function monkeyPatch(module: object, methodName: string, options: object): (data: object) => any
	export function onRemoved(node: HTMLElement, callback: () => void): void
	export function saveData(pluginName: string, key: string, data: any): void
	export function setData(pluginName: string, key: string, data: any): void
	export function showToast(content: string, options: object): void
	export function surpressErrors(method: () => void, message?: string): () => void
	export function testJSON(data: string): boolean
	export function unlinkJS(id: string): void
}
