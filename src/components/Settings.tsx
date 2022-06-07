import * as React from "react";
import { useState } from "react";
import { Button, Flex, TextInput, Text } from "ittai/components";
import * as settings from "ittai/settings";
import SettingsAPI from "ittai/settings";
import Instance from "../entities/Instance";

interface InstanceProps {
	onClick?: (url?: string) => any;
	value?: string;
	placeholder?: string;
}
function Instance(props: InstanceProps): JSX.Element {
	const [value, setValue] = useState<string | undefined>(props.value);
	return (
		<Flex direction="row">
			<TextInput
				placeholder={props.placeholder}
				value={value}
				onChange={(newValue) => {
					setValue(newValue);
				}}
			/>

			<Button onClick={() => {
				if (props.onClick) props.onClick(value);
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
			<Instance value={x.gatewayUrl} onClick={(url) => {
				const index = instances.findIndex((e) => e.gatewayUrl == x.gatewayUrl);

				if (!url) {
					instances.splice(index, 1);
					setInstances(instances);
					return;
				}

				const instance: Instance = {
					gatewayUrl: url,
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

			<Instance placeholder="New Instance Base URL" onClick={(url) => {
				if (!url || instances.find(x => x.gatewayUrl == url)) {
					return;
				}

				const newInstance: Instance = {
					gatewayUrl: url
				};

				setInstances(instances.concat([newInstance]));
				settings.set("instances", instances);
			}} />
		</div>
	);
}