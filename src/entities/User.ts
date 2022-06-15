import { patcher, webpack } from "ittai";
import { Client } from "../client/Client";
import BaseClass from "./BaseClass";

export default interface User extends BaseClass {
	avatar: string | null;
	discriminator: string;
	email: string;
	flags: string;
	mfa_enabled: boolean;
	nsfw_allowed: boolean;
	phone: string | null;
	premium: boolean;
	premium_type: number;
	public_flags: number;
	username: string;
	verified: boolean;
	bot: boolean;
	accent_color: number;
	banner: string | null;
	bio: string;
	premium_since: string;

	user?: User;
	permissionOverwrites?: any[];
	roles?: any[];
}

export const makeUser = (user: Partial<User>, client: Client) => {
	const userInternal = webpack.findByPrototype("addGuildAvatarHash") as any;
	const ret = new userInternal(user);

	ret.user = client.user,
	ret.permissionOverwrites = [];
	ret.roles = [];

	patcher.instead(
		"fosscord",
		ret,
		"getAvatarSource",
		(args, original) => {
			client.log(args);
			return original(...args);
		}
	)

	return ret;
};