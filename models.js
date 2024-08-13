const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		created_at: { type: Date, default: Date.now },
	},
	{ collection: "Users" }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
