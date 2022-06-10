import { React } from "ittai/webpack";
const { useState } = React;
// import * as React from "react";
// import { useState } from "react";
import { Button, Flex, TextInput, Forms, Switch } from "ittai/components";
import * as settings from "ittai/settings";
import Instance from "../entities/Instance";

import Collapsible from "./Collapsible";

import "./styles/Settings.css";
import NamedElement from "./NamedElement";
import Dropdown from "./Dropdown";

interface InstanceProps {
	instance: Instance,
	onClick: (instance: Instance) => any;
	onDelete: () => any;
	resetOnSubmit?: boolean,
	showDelete?: boolean,
}

const InstanceElement: React.FC<InstanceProps> = (props) => {
	props.showDelete = props.showDelete ?? true;
	const [instance, setInstance] = useState(props.instance);
	return (
		<div className="fosscord-settings-instance">
			<Forms.FormItem
				title="API URL"
			>
				<TextInput
					value={instance.apiUrl}
					placeholder="API URL"
					onChange={(value) => {
						setInstance({ ...instance, apiUrl: value });
					}}
				/>
			</Forms.FormItem>

			<Forms.FormItem
				title="Token"
			>
				<TextInput
					//@ts-ignore
					type="password"
					value={instance.token}
					placeholder="Token"
					onChange={(value) => {
						setInstance({ ...instance, token: value });
					}}
				/>
			</Forms.FormItem>

			<Flex align={Flex.Align.CENTER} justify={Flex.Justify.END}>
				<Forms.FormItem>
					<Button
						onClick={() => props.onClick(instance)}
					>
						{"Save"}
					</Button>
				</Forms.FormItem>

				{props.showDelete ? (
					<Forms.FormItem
						style={{ marginLeft: "10px" }}
					>
						<Button
							onClick={() => props.onDelete()}
							color={Button.Colors.RED}
						>
							{"Delete"}
						</Button>
					</Forms.FormItem>
				) : (null)}
			</Flex>
		</div >
	);
};

const SettingsPage: React.FC<{ onReload: (instances: Instance[]) => any; }> = (props) => {
	const [instances, setInstances] = useState<Instance[]>(settings.get("instances", []));
	const [logLevel, setLogLevel] = useState<string>(settings.get("loggingLevel", "none"));

	const setInstancesAndSave = (array: Instance[]) => {
		setInstances(array);
		settings.set("instances", array);
		props.onReload(array);
	};

	return (
		<div
			className="fosscord-settings"
			style={{ color: "white" }}
		>
			<div className="fosscord-settings-plugin">
				<Collapsible
					title="Plugin settings"
					innerStyle={{ padding: "10px" }}
				>
					<NamedElement name="Logging level">
						<Dropdown
							value={logLevel}
							options={{
								"none": "None",
								"log": "All",
								"warn": "Warnings",
								"error": "Errors",
							}}
							onChange={(val) => {
								setLogLevel(val);
								settings.set("loggingLevel", val);
							}}
						/>
					</NamedElement>
				</Collapsible>
			</div>

			<Forms.FormDivider className="fosscord-divider" />

			<div className="fosscord-settings-new-Instance">
				<Collapsible
					title="New Instance"
					innerStyle={{ padding: "10px" }}
				>
					<InstanceElement
						instance={{}}
						resetOnSubmit={true}
						showDelete={false}
						onDelete={() => { }}
						onClick={(newInstance) => {
							newInstance.enabled = true;
							setInstancesAndSave([...instances, newInstance]);
						}}
					/>
				</Collapsible>
			</div>

			<Forms.FormDivider className="fosscord-divider" />

			<div className="fosscord-settings-instances">
				{instances.map((instance: Instance, index: number) => {
					return (
						<Collapsible
							title={instance.info ? instance.info.name! : new URL(instance.apiUrl!).hostname}
							innerStyle={{ padding: "10px" }}
							additionalComponentsRight={
								<Switch
									checked={instance.enabled}
									onChange={(val) => {
										instances[index].enabled = val;
										setInstancesAndSave([...instances]);
									}}
								/>
							}
						>
							<InstanceElement
								instance={instance}
								onClick={(edited) => {
									instances[index] = edited;
									setInstancesAndSave([...instances]);
								}}
								onDelete={() => {
									instances.splice(index, 1);
									setInstancesAndSave([...instances]);
								}}
							/>
						</Collapsible>
					);
				})}
			</div>
		</div>
	);
};

export default SettingsPage;