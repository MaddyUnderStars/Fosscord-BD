import { ModalActions, React } from "ittai/webpack";
const { useState } = React;
import { Button, Flex, TextInput, Forms } from "ittai/components";

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

export default InstanceElement;