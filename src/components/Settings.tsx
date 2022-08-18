import { React } from "ittai/webpack";
const { useState } = React;
import { Forms, Switch } from "ittai/components";
import * as settings from "ittai/settings";

import Collapsible from "./Collapsible";

import "./styles/Settings.css";
import NamedElement from "./NamedElement";
import Dropdown from "./Dropdown";
import InstanceElement from "./Instance";

const SettingsPage: React.FC<{ onReload: (instances: Instance[]) => any; }> = (props) => {
	const [instances, setInstances] = useState<Instance[]>(settings.get("instances", []));
	const [logLevel, setLogLevel] = useState<string>(settings.get("loggingLevel", "error"));
	const [newInstance, setNewInstance] = useState<Instance>({});

	const setInstancesAndSave = async (array: Instance[]) => {
		setInstances(array);
		settings.set("instances", array);
		await props.onReload(array.filter(x => x.enabled));
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
								"debug": "Debug",
								"log": "Info",
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
						instance={newInstance}
						setInstance={setNewInstance}
						resetOnSubmit={true}
						showDelete={false}
						onDelete={() => { }}
						onSave={(val) => {
							val.enabled = true;
							setInstancesAndSave([...instances, val]);
							setNewInstance({ apiUrl: "", token: "" });
						}}
					/>
				</Collapsible>
			</div>

			<Forms.FormDivider className="fosscord-divider" />

			<div className="fosscord-settings-instances">
				{instances.map((instance: Instance, index: number, array) => {
					if (!instance.apiUrl) return;	// where is this coming from?

					try {
						var tempName = new URL(instance.apiUrl!).hostname;
					}
					catch (e) {
						var tempName = "Invalid URL";
					}

					return (
						<Collapsible
							title={instance.info ? instance.info.name! : tempName}
							innerStyle={{ padding: "10px" }}
							additionalComponentsRight={
								<Switch
									checked={instance.enabled}
									onChange={(val) => {
										array[index].enabled = val;
										setInstancesAndSave([...array]);
									}}
								/>
							}
						>
							<InstanceElement
								instance={instance}
								setInstance={(val) => { array[index] = val; setInstances([...array]); }}
								onSave={(edited) => {
									array[index] = edited;
									setInstancesAndSave([...array]);
								}}
								onDelete={() => {
									array.splice(index, 1);
									setInstancesAndSave([...array]);
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