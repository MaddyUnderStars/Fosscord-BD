import { webpack, components } from "ittai";
const {  ModalActions, React  } = webpack;
const { Button, Forms, Modal, TextInput } = components;
const { useState } = React;
import { HttpClient } from "../client/HttpClient";

const login = async (instance: Instance, username: string, password: string): Promise<string> => {
	const ret = await HttpClient.send({
		path: `${instance.apiUrl}/auth/login`,
		method: "POST",
		body: {
			login: username,
			password: password,
		}
	});

	return ret.body!.token;
};

interface LoginModalProps {
	instance: Instance,
	onLogin: (token: string) => any;
}

const LoginModal: React.FC<LoginModalProps> = (props: any) => {
	const [username, setUsername] = useState<string>();
	const [password, setPassword] = useState<string>();

	return (
		<Modal.ModalRoot
			size={Modal.ModalSize.DYNAMIC}
			transitionState={1}
		>
			<Modal.ModalHeader>
				<Modal.ModalCloseButton onClick={() => { ModalActions.closeModal("fosscord-login"); }} />
			</Modal.ModalHeader>

			<Modal.ModalContent>
				<div style={{ padding: "20px" }}>
					<Forms.FormItem title={"Username"}>
						<TextInput
							value={username}
							placeholder={"Username"}
							onChange={(value) => { setUsername(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem title={"Password"}>
						<TextInput
							//@ts-ignore
							type="password"
							value={password}
							placeholder={"Password"}
							onChange={(value) => { setPassword(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem>
						<Button
							onClick={async () => {
								if (!username || !password) return;
								const token = await login(props.instance, username, password);
								props.onLogin(token);
								ModalActions.closeModal("fosscord-login");
							}}
						>
							{"Login"}
						</Button>
					</Forms.FormItem>
				</div>
			</Modal.ModalContent>
		</Modal.ModalRoot>
	);
};

export default LoginModal;