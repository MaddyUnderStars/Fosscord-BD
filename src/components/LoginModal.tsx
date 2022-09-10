import { Button, Forms, Modal, TextInput } from "ittai/components";
import { ModalActions, React } from "ittai/webpack";
import { webpack } from "ittai";
import { APIResponse, HttpClient } from "../client/HttpClient";
const { useState } = React;

const HCaptcha = webpack.find(x => x.toString().includes("resetCaptcha"));

const login = async (instance: Instance, username: string, password: string, doCaptcha: Function, captchaKey?: string): Promise<string> => {
	var ret: APIResponse;
	try {
		ret = await HttpClient.send({
			path: `${instance.apiUrl}/auth/login`,
			method: "POST",
			body: {
				login: username,
				password: password,
				captcha_key: captchaKey,
			}
		});
	}
	catch (e: any) {
		if (e.body!.captcha_sitekey) return await login(instance, username, password, doCaptcha, await doCaptcha(e.body.captcha_sitekey));
		if (e.body!.mfa) {
			// handle mfa
		}

		return "";
	}


	return ret.body!.token;
};

interface CaptchaModalProps {
	sitekey: string;
	callback: (token: string) => any;
}

const CaptchaModal: React.FC<CaptchaModalProps> = (props: CaptchaModalProps) => {
	return (
		<Modal.ModalRoot
			size={Modal.ModalSize.DYNAMIC}
			transitionState={1}
		>
			<Modal.ModalHeader>
				<Modal.ModalCloseButton onClick={() => { ModalActions.closeModal("fosscord-login-captcha"); }} />
			</Modal.ModalHeader>

			<Modal.ModalContent>
				<div style={{ padding: "20px" }}>
					<HCaptcha sitekey={props.sitekey} onVerify={props.callback} />
				</div>
			</Modal.ModalContent>
		</Modal.ModalRoot>
	);
};

interface LoginModalProps {
	instance: Instance,
	onLogin: (token: string) => any;
}

const LoginModal: React.FC<LoginModalProps> = (props: LoginModalProps) => {
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

								const doCaptcha = (sitekey: string) => new Promise((resolve, reject) => {
									ModalActions.openModal(() => {
										return (
											<CaptchaModal sitekey={sitekey} callback={(token: string) => {
												ModalActions.closeModal("fosscord-login-captcha");
												resolve(token);
											}
											} />
										);
									}, { modalKey: "fosscord-login-captcha" });
								});

								const token = await login(props.instance, username, password, doCaptcha);
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