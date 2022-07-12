import { React } from "ittai/webpack"

import "./styles/NamedElement.css"

interface NamedElementProps {
	name: string;
}

const NamedElement: React.FC<React.PropsWithChildren<NamedElementProps>> = (props) => {
	return (
		<div className="fosscord-namedElement">
			<div>{props.name}</div>
			<div>
				{props.children}
			</div>
		</div>
	);
};

export default NamedElement;