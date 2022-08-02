import { webpack } from "ittai";
const { React } = webpack;

import "./styles/Dropdown.css"

interface DropdownProps {
	value?: string;
	// value - displayed
	options: { [key: string]: string; };
	onChange: (val: string) => any;
}

const Dropdown: React.FC<DropdownProps> = (props) => {
	return (
		<select
			className="fosscord-dropdown-container"
			value={props.value}
			onChange={(event) => props.onChange(event.target.value)}>
			{Object.keys(props.options).map(x => {
				return (
					<option
						className="fosscord-dropdown-option"
						value={x}>
						{props.options[x]}
					</option>
				);
			})}
		</select>
	);
};

export default Dropdown;