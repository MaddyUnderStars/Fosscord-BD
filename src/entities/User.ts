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
}

export const makeUser = (user: Partial<User>, client: Client) => {
	const userInternal = ZLibrary.WebpackModules.getByPrototypes("addGuildAvatarHash") as any;
	return new userInternal(user);
};