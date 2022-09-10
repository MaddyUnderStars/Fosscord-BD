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
	const { instance, setInstance } = props;
	const [errors, setErrors] = useState<{ field: string, value: string; }[]>([]);

	const clearError = (field: string) => {
		setErrors(errors.filter(x => x.field !== field));
	};

	const addError = (field: string, value: string) => {
		setErrors([...errors, { field: field, value: value }]);
	};

	const validateApiUrl = () => {
		if (!instance.apiUrl)
			return addError("url", "Required"), false;

		try { new URL(instance.apiUrl); }
		catch (e) { return addError("url", "Invalid URL"), false; }

		clearError("api");
		return true;
	};

	return (
		<div className="fosscord-settings-instance">
			<Forms.FormItem title="API URL">
				<TextInput
					value={instance.apiUrl}
					placeholder={"API URL"}
					error={errors.find(x => x.field == "url")?.value}
					onChange={(value) => {
						clearError("url");
						setInstance({ ...instance, apiUrl: value });
					}}
				/>
			</Forms.FormItem>

			<Forms.FormItem title="Token">
				<TextInput
					//@ts-ignore
					type="password"
					value={instance.token}
					placeholder={"Token"}
					error={errors.find(x => x.field == "token")?.value}
					onChange={(value) => {
						clearError("token");
						setInstance({ ...instance, token: value });
					}}
				/>
			</Forms.FormItem>

			<Flex align={Flex.Align.CENTER} justify={Flex.Justify.END} className="fosscord-instance-buttons">
				<Forms.FormItem>
					<Button
						onClick={() => {
							if (!validateApiUrl()) return;
							ModalActions.openModal(() => {
								return (
									<LoginModal
										instance={instance}
										onLogin={(token: string) => {
											const saved = { ...instance, token: token };
											setInstance(saved);
											props.onSave(saved);
										}}
									/>
								);
							}, { modalKey: "fosscord-login" });
						}}
					>
						{"Login with password"}
					</Button>
				</Forms.FormItem>

				<Forms.FormItem>
					<Button
						onClick={() => {
							if (!validateApiUrl()) return;
							if (!instance.token)
								return addError("token", "Required");

							clearError("token");
							props.onSave(instance);
						}}
					>
						{"Save"}
					</Button>
				</Forms.FormItem>

				{props.showDelete ? (
					<Forms.FormItem>
						<Button
							color={Button.Colors.RED}
							onClick={() => {
								props.onDelete();
							}}
						>
							{"Delete"}
						</Button>
					</Forms.FormItem>
				) : null}
			</Flex>
		</div >
	);
};

export default InstanceElement;