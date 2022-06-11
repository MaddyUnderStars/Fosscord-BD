/*
Is it bad that I'm using require here? maybe
but also the alternative is:

import whatever from "./whatever";
... a billion times

export [
	...everything imported
]

*/

export default [
	require("./analytics").default,
	require("./api").default,
	require("./dispatcher").default,
	require("./iconManager").default,
]