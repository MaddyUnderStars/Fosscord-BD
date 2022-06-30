import BaseClass from "./BaseClass";
import User from "./User";

export default interface Relationship extends BaseClass {
	type: number,
	user?: User,
	nickname?: string,
}