import * as React from "react";
import { useState } from "react";
import { Button, Forms } from "ittai/components";

import "./styles/Collapsible.css"

interface CollapsibleProps extends React.PropsWithChildren {
	open?: boolean,
	title: string;
	style?: any;
	innerStyle?: any;

	additionalComponentsRight?: JSX.Element;
}

const Collapsible: React.FC<CollapsibleProps> = (props) => {
	const [opened, setOpened] = useState(props.open);

	return (
		<div style={props.style} className="fosscord-collapsible">
			<div
				className="fosscord-collapsibleHeader"
			>
				<Forms.FormTitle>{props.title}</Forms.FormTitle>

				<div
					className="fosscord-collapsibleHeader-right"
				>
					{props.additionalComponentsRight}
					<Button
						onClick={() => setOpened(!opened)}
						size={Button.Sizes.TINY}
						look={Button.Looks.OUTLINED}
					>
						{opened ? "X" : ">"}
					</Button>
				</div>
			</div>
			<div
				className="fosscord-collapsibleBody"
				style={{
					display: opened ? "block" : "none",
					...props.innerStyle,
				}}
			>
				{props.children}
			</div>
		</div>
	);
};

export default Collapsible;