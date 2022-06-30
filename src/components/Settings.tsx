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
	onClick: (instance: Instance) => any;
	onDelete: () => any;
	resetOnSubmit?: boolean,
	showDelete?: boolean,
}

const InstanceElement: React.FC<InstanceProps> = (props) => {
	props.showDelete = props.showDelete ?? true;
	let { instance, setInstance } = props;
	const [error, setError] = useState<string>();

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
					error={!instance.apiUrl && error ? error : undefined}
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
						onClick={() => {
							if (!instance.apiUrl) {
								return setError("Required");
							}
							setError(undefined);
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
								return setError("Required");
							}

							setError(undefined);
							props.onClick(instance);
							setInstance({
								apiUrl: "",
								token: "",
							});
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
		await props.onReload(array);
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
						onClick={(val) => {
							val.enabled = true;
							setInstancesAndSave([...instances, val]);
						}}
					/>
				</Collapsible>
			</div>

			<Forms.FormDivider className="fosscord-divider" />

			<div className="fosscord-settings-instances">
				{instances.map((instance: Instance, index: number, array) => {
					return (
						<Collapsible
							title={instance.info ? instance.info.name! : new URL(instance.apiUrl!).hostname}
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
								setInstance={(val) => { array[index] = val; setInstances([...array]) }}
								onClick={(edited) => {
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