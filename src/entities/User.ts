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

const userInternal = webpack.findByPrototype("addGuildAvatarHash") as any;
export const makeUser = (user: Partial<User>, client: Client) => {
	user = new userInternal(user);

	const member = user;
	member.user = user as User,
	member.permissionOverwrites = member.permissionOverwrites ?? [];
	member.roles = member.roles ?? [];

	// add to user store
	webpack.findByProps("getCurrentUser", "getUser").getUsers()[user.id!] = user;

	return member;
};