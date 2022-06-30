import { React } from "ittai/webpack"

interface NamedElementProps {
	name: string;
}

const NamedElement: React.FC<React.PropsWithChildren<NamedElementProps>> = (props) => {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center"
			}}
			className="fosscord-namedSwitch"
		>
			<div>{props.name}</div>
			<div>
				{props.children}
			</div>
		</div>
	);
};

export default NamedElement;