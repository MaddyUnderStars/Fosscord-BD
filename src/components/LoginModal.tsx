import { Button, Forms, Modal, TextInput } from "ittai/components";
import { React } from "ittai/webpack";
import { HttpClient } from "../client/HttpClient";
import Instance from "../entities/Instance";
const { useState } = React;

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
			<Modal.ModalFooter>
				<div>
					{"Test"}
				</div>
			</Modal.ModalFooter>

			<Modal.ModalContent>
				<div>
					<Forms.FormItem title={"Username"}>
						<TextInput
							value={username}
							placeholder={"Username"}
							onChange={(value) => { setUsername(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem title={"Password"}>
						<TextInput
							value={password}
							placeholder={"Password"}
							onChange={(value) => { setPassword(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem>
						<Button
							onClick={async () => {
								if (!username || !password) return;
								const token = login(props.instance, username, password);
								props.onLogin(token);
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