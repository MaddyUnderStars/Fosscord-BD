import { Nullable } from "../util/Nullable";

type InstanceGeneralInfo = Nullable<{
	id: string;
	name: string;
	description: string;
	image: string;

	correspondenceEmail: string,
	correspondenceUserID: string,

	frontPage: string,
	tosPage: string,
}>

export default interface Instance {
	username?: string;
	password?: string;
	token?: string;
	gatewayUrl?: string;
	cdnUrl?: string;
	apiUrl?: string;
	info?: InstanceGeneralInfo;
}