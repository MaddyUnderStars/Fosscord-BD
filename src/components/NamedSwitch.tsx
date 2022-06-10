import * as React from "react";
import { Switch, SwitchProps } from "ittai/components";

interface NamedSwitchProps extends SwitchProps {
	name: string;
}

const NamedSwitch: React.FC<NamedSwitchProps> = (props) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center "
			}}
			className="fosscord-namedSwitch"
		>
			<div>{props.name}</div>
			<Switch {...props} />
		</div>
	);
};

export default NamedSwitch;