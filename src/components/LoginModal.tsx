import { Button, Forms, Modal, TextInput } from "ittai/components";
import { ModalActions, React } from "ittai/webpack";
import { webpack } from "ittai";
import { APIResponse, HttpClient } from "../client/HttpClient";
const { useState, useEffect } = React;
const HCaptcha = webpack.find(x => x.toString().includes("resetCaptcha"));

interface MfaModalProps {
	instance: Instance;
	ticket: string;
	callback: (token: string) => any;
}

const MfaModal: React.FC<MfaModalProps> = (props: MfaModalProps) => {
	const [code, setCode] = useState<string>();
	const [error, setError] = useState<string>();

	const doMfa = async () => {
		try {
			const ret = await HttpClient.send({
				path: `${props.instance.apiUrl}/auth/mfa/totp`,
				method: "POST",
				body: {
					code: code,
					ticket: props.ticket,
				}
			});
			return props.callback(ret.body.token);
		}
		catch (e) {
			setError("Invalid 2fa code.");
		}
	};

	return (
		<Modal.ModalRoot
			size={Modal.ModalSize.SMALL}
			transitionState={1}
		>
			<Modal.ModalHeader>
				<Modal.ModalCloseButton onClick={() => { ModalActions.closeModal("fosscord-login-mfa"); }} />
			</Modal.ModalHeader>

			<Modal.ModalContent>
				<div style={{ padding: "20px" }}>
					<Forms.FormItem title={"MFA code"}>
						<TextInput
							value={code}
							error={error}
							placeholder={"MFA Code"}
							onChange={(value) => { setCode(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem>
						<Button
							onClick={doMfa}
						>
							{"Login"}
						</Button>
					</Forms.FormItem>
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
	const [errors, setErrors] = useState<{ field: string, value: string; }[]>([]);
	const [password, setPassword] = useState<string>();
	const [siteKey, setSiteKey] = useState<string>();
	const [captchaKey, setCaptchaKey] = useState<string>();

	const doLogin = async () => {
		try {
			const ret = await HttpClient.send({
				path: `${props.instance.apiUrl}/auth/login`,
				method: "POST",
				body: {
					login: username ?? "",
					password: password ?? "",
					captcha_key: captchaKey ?? "",
				}
			});

			if (ret.body.mfa) {
				ModalActions.openModal(() => {
					return (
						<MfaModal
							instance={props.instance}
							ticket={ret.body.ticket}
							callback={(token: string) => {
								ModalActions.closeModal("fosscord-login-mfa");
								ModalActions.closeModal("fosscord-login");
								props.onLogin(token);
							}}
						/>
					);
				}, { modalKey: "fosscord-login-mfa" });
				return;
			}

			ModalActions.closeModal("fosscord-login");
			return props.onLogin(ret.body.token);
		}
		catch (e: any) {
			const { body } = e as APIResponse;
			if (body.captcha_sitekey) {
				try {
					if (hcaptcha) {
						hcaptcha.reset;
					}
				}
				catch (e) { }	// first run
				return setSiteKey(body.captcha_sitekey);
			}

			if (body.errors) {
				const errors: { field: string, value: string; }[] = [];
				for (var error in body.errors) {
					// lame but it works
					errors.push({ field: error, value: body.errors[error]["_errors"][0].message });
				}
				setErrors(errors);
			}

			if (body.retry_after) {
				setErrors([{ field: "login", value: `You are being rate limited. Retry after ${body.retry_after} seconds` }]);
			}
		}
	};

	return (
		<Modal.ModalRoot
			size={Modal.ModalSize.MEDIUM}
			transitionState={1}
		>
			<Modal.ModalHeader>
				<Modal.ModalCloseButton onClick={() => { ModalActions.closeModal("fosscord-login"); }} />
			</Modal.ModalHeader>

			<Modal.ModalContent>
				<div style={{ padding: "40px" }}>
					<Forms.FormItem title={"Username"}>
						<TextInput
							value={username}
							placeholder={"Username"}
							error={errors.find(x => x.field == "login")?.value}
							onChange={(value) => { setUsername(value); }}
						/>
					</Forms.FormItem>

					<Forms.FormItem title={"Password"}>
						<TextInput
							//@ts-ignore
							type="password"
							value={password}
							placeholder={"Password"}
							error={errors.find(x => x.field == "password")?.value}
							onChange={(value) => { setPassword(value); }}
						/>
					</Forms.FormItem>

					{siteKey ?
						(<div style={{ marginTop: "10px" }}>
							<HCaptcha
								sitekey={siteKey}
								onVerify={setCaptchaKey}
							/>
						</div>)
						: null
					}

					<Forms.FormItem>
						<Button onClick={doLogin}>
							{"Login"}
						</Button>
					</Forms.FormItem>
				</div>
			</Modal.ModalContent>
		</Modal.ModalRoot>
	);
};

export default LoginModal;