const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		shelves: [
			{ shelf_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shelf" } },
		],
		created_at: { type: Date, default: Date.now },
	},
	{ collection: "Users" }
);

const User = mongoose.model("User", userSchema);

const bookSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		author: { type: String, required: true },
		isbn: { type: String, required: true, unique: true },
		published: { type: Date, required: true },
		publisher: { type: String, required: true },
		genres: { type: [String], required: true },
		cover: { type: String, required: true },
		created_at: { type: Date, default: Date.now },
	},
	{ collection: "Books" }
);

const Book = mongoose.model("Book", bookSchema);

const shelfSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
		name: { type: String, required: true },
		books: [
			{
				book_id: { type: mongoose.Schema.Types.ObjectId, required: true },
				added_at: { type: Date },
			},
		],
		created_at: { type: Date, default: Date.now },
	},
	{ collection: "Shelves" }
);

const Shelf = mongoose.model("Shelf", shelfSchema);
module.exports = { User, Book, Shelf };
