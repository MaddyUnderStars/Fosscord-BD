import * as React from "react";
import { useState } from "react";
import { Button, Forms } from "ittai/components";

interface CollapsibleProps extends React.PropsWithChildren {
	open?: boolean,
	title: string;
	style?: any;
	innerStyle?: any;
}

const Collapsible: React.FC<CollapsibleProps> = (props) => {
	const [opened, setOpened] = useState(props.open);

	return (
		<div style={props.style} className="fosscord-collapsible">
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center"
				}}
				className="fosscord-collapsibleHeader"
			>
				<Forms.FormTitle>{props.title}</Forms.FormTitle>
				<Button
					onClick={() => setOpened(!opened)}
					size={Button.Sizes.TINY}
					look={Button.Looks.OUTLINED}
				>
					{opened ? "X" : ">"}
				</Button>
			</div>
			<div
				className="fosscord-collapsibleBody"
				style={{
					display: opened ? "block" : "none",
					backgroundColor: "rgba(0, 0, 0, 0.1)",
					marginTop: "10px",
					...props.innerStyle,
				}}
			>
				{props.children}
			</div>
		</div>
	);
};

export default Collapsible;