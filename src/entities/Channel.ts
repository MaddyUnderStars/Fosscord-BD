import { webpack } from "ittai";
import { Client } from "../client/Client";
import BaseClass from "./BaseClass";

// Copied from fosscord/fosscord-server
export enum CHANNEL_TYPES {
	GUILD_TEXT = 0, // a text channel within a guild
	DM = 1, // a direct message between users
	GUILD_VOICE = 2, // a voice channel within a guild
	GROUP_DM = 3, // a direct message between multiple users
	GUILD_CATEGORY = 4, // an organizational category that contains zero or more channels
	GUILD_NEWS = 5, // a channel that users can follow and crosspost into a guild or route
	GUILD_STORE = 6, // a channel in which game developers can sell their things
	ENCRYPTED = 7, // end-to-end encrypted channel
	ENCRYPTED_THREAD = 8, // end-to-end encrypted thread channel
	TRANSACTIONAL = 9, // event chain style transactional channel
	GUILD_NEWS_THREAD = 10, // a temporary sub-channel within a GUILD_NEWS channel
	GUILD_PUBLIC_THREAD = 11, // a temporary sub-channel within a GUILD_TEXT channel
	GUILD_PRIVATE_THREAD = 12, // a temporary sub-channel within a GUILD_TEXT channel that is only viewable by those invited and those with the MANAGE_THREADS permission
	GUILD_STAGE_VOICE = 13, // a voice channel for hosting events with an audience
	DIRECTORY = 14, // guild directory listing channel
	GUILD_FORUM = 15, // forum composed of IM threads
	TICKET_TRACKER = 33, // ticket tracker, individual ticket items shall have type 12
	KANBAN = 34, // confluence like kanban board
	VOICELESS_WHITEBOARD = 35, // whiteboard but without voice (whiteboard + voice is the same as stage)
	CUSTOM_START = 64, // start custom channel types from here
	UNHANDLED = 255 // unhandled unowned pass-through channel type
}

export interface Channel extends BaseClass {
	[key: string]: any;	//todo
}

export interface EventChannel {
	// TODO, Discord internally uses different names than the ones sent over gateway
}

export const makeChannel = (channel: Partial<Channel>, client: Client): EventChannel => {
	const channelInternal = webpack.findByProps("fromServer") as any;
	if (!channel.member) channel.members = client.user;
	channel = new channelInternal(channel);
		
	if (!channel.id) {
		throw new Error("Can't makeChannel without ID");
	}

	return channel;
};