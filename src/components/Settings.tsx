import { ModalActions, React } from "ittai/webpack";
const { useState } = React;
import { Button, Flex, TextInput, Forms, Switch } from "ittai/components";
import * as settings from "ittai/settings";
import Instance from "../entities/Instance";

import Collapsible from "./Collapsible";

import "./styles/Settings.css";
import NamedElement from "./NamedElement";
import Dropdown from "./Dropdown";
import LoginModal from "./LoginModal";

interface InstanceProps {
	instance: Instance,
	setInstance: (instance: Instance) => any,
	onSave: (instance: Instance) => any;
	onDelete: () => any;
	resetOnSubmit?: boolean,
	showDelete?: boolean,
}

const InstanceElement: React.FC<InstanceProps> = (props) => {
	props.showDelete = props.showDelete ?? true;
	let { instance, setInstance } = props;
	const [apiError, setApiError] = useState<string>();
	const [tokenError, setTokenError] = useState<string>();

	const openLoginModal = () => {
		return (
			<LoginModal
				instance={instance}
				onLogin={(token: string) => {
					instance.token = token;
					setInstance({ ...instance });
				}}
			/>
		);
	};

	return (
		<div className="fosscord-settings-instance">
			<Forms.FormItem
				title="API URL"
			>
				<TextInput
					value={instance.apiUrl}
					placeholder="API URL"
					error={apiError}
					onChange={(value) => {
						setApiError(undefined);
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
					error={tokenError}
					value={instance.token}
					placeholder="Token"
					onChange={(value) => {
						setTokenError(undefined);
						setInstance({ ...instance, token: value });
					}}
				/>
			</Forms.FormItem>

			<Flex align={Flex.Align.CENTER} justify={Flex.Justify.END}>
				<Forms.FormItem>
					<Button
						onClick={() => {
							if (!instance.apiUrl) {
								return setApiError("Required");
							}

							try {
								new URL(instance.apiUrl);
							}
							catch (e) {
								return setApiError("Invalid URL");
							}

							setApiError(undefined);
							ModalActions.openModal(openLoginModal, { modalKey: "fosscord-login" });
						}}>
						{"Login with password"}
					</Button>
				</Forms.FormItem>

				<Forms.FormItem>
					<Button
						style={{ marginLeft: "10px" }}
						onClick={() => {
							if (!instance.apiUrl) {
								return setApiError("Required");
							}

							try {
								new URL(instance.apiUrl);
							}
							catch (e) {
								return setApiError("Invalid URL");
							}

							if (!instance.token) {
								return setTokenError("Required");
							}

							setApiError(undefined);
							props.onSave(instance);
						}}
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