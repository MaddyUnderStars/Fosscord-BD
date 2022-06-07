import * as React from "react";
import { useState } from "react";
import { Button, Flex, TextInput, Text } from "ittai/components";
import * as settings from "ittai/settings";
import SettingsAPI from "ittai/settings";
import Instance from "../entities/Instance";
import { webpack } from "ittai";

interface InstanceProps {
	onClick?: (url?: string, token?: string) => any;
	url?: string;
	token?: string;
	placeholder?: string;
}

function Instance(props: InstanceProps): JSX.Element {
	const [url, setUrl] = useState<string | undefined>(props.url);
	const [token, setToken] = useState<string | undefined>(props.token);
	return (
		<Flex direction="row" style={{ padding: "20px" }}>
			<div style={{ width: "100%" }}>
				<div>
					<TextInput
						placeholder={props.placeholder}
						value={url}
						onChange={(newValue) => {
							setUrl(newValue);
						}}
					/>
				</div>

				<div>
					<TextInput
						placeholder={props.placeholder}
						value={token}
						onChange={(newValue) => {
							setToken(newValue);
						}}
					/>
				</div>
			</div>

			<Button
				style={{ height: "100%" }}
				onClick={() => {
					if (props.onClick) props.onClick(url, token);
				}}>
				{"Save"}
			</Button>
		</Flex>
	);
}

export default function Settings(): JSX.Element {
	const [instances, setInstances] = useState<Instance[]>(settings.get("instances", []));

	const instanceComponents = instances.map(x => {
		return (
			<Instance url={new URL(x.apiUrl!).hostname} token={x.token} onClick={(url, token) => {
				const index = instances.findIndex((e) => e.apiUrl == x.apiUrl);

				if (!url) {
					instances.splice(index, 1);
					setInstances(instances);
					return;
				}

				const parsed = new URL(url);

				const instance: Instance = {
					apiUrl: `https://${parsed.hostname}/api/v9`,
					token: token,
				};

				instances[index] = instance;
				setInstances(instances);
				settings.set("instances", instances);
			}} />
		);
	});

	return (
		<div>
			{"Instances:"}
			{(() => {
				if (instanceComponents.length) return instanceComponents;
				return [];
			})()}

			<Instance placeholder="New Instance Base URL" onClick={(url, token) => {
				if (!url || instances.find(x => x.apiUrl == url)) {
					return;
				}

				const parsed = new URL(url);

				const instance: Instance = {
					apiUrl: `https://${parsed.hostname}/api/v9`,
					token: token,
				};

				setInstances(instances.concat([instance]));
				settings.set("instances", instances);
			}} />
		</div>
	);
}