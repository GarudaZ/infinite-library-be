const request = require("supertest");
const app = require("../app");
const endpoints = require("../endpoints.json");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const { User, Shelf, Book } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

beforeEach(async () => {
	await mongoose.connect(process.env.MONGODB_TEST_CONNECTION);

	const collections = await mongoose.connection.db.collections();
	for (const collection of collections) {
		await collection.deleteMany({});
	}
});

afterAll((done) => {
	mongoose.connection.close();
	done();
});

describe("GET /api", () => {
	it("returns the correct json file containing the endpoint details", async () => {
		const response = await request(app).get("/api").expect(200);
		expect(response.body).toEqual(endpoints);
	});
});

describe("POST /api/users", () => {
	it("returns 201 status code and returns the JSON of the user add to the collection", async () => {
		const newUser = {
			username: "testuser",
			password: "securepassword",
			shelves: [],
		};

		const response = await request(app)
			.post("/api/users")
			.send(newUser)
			.expect(201);
		expect(response.body).toHaveProperty("added_user");
		expect(response.body.added_user).toBeInstanceOf(Object);

		expect(response.body.added_user.username).toBe("testuser");
		expect(typeof response.body.added_user.password).toBe("string");
		expect(response.body.added_user.password === newUser.password).toBe(false);
	});
	it("returns 400 when a duplicate username is submitted", async () => {
		const hashedPassword = await bcrypt.hash("securepassword", 10);

		const newUser = new User({
			username: "testuser",
			password: hashedPassword,
			shelves: [],
		});

		await newUser.save();

		const response = await request(app)
			.post("/api/users")
			.send({ username: "testuser", password: hashedPassword })
			.expect(400);
		expect(response.body.message).toBe("Username already exists");
	});
	it("returns 400 when username or password are missing", async () => {
		const hashedPassword = await bcrypt.hash("securepassword", 10);

		const response = await request(app)
			.post("/api/users")
			.send({ password: hashedPassword })
			.expect(400);
		expect(response.body.message).toBe("Username and password are required");
	});
});
describe("POST /api/users/login", () => {
	it("returns 201 status code and returns the JSON of the user add to the collection", async () => {
		const hashedPassword = await bcrypt.hash("securepassword", 10);

		const newUser = new User({
			username: "testuser",
			password: hashedPassword,
			shelves: [],
		});

		await newUser.save();

		const login = {
			username: "testuser",
			password: "securepassword",
		};

		const response = await request(app)
			.post("/api/users/login")
			.send(login)
			.expect(200);

		expect(response.body.success).toBe("Logged in successfully");
	});
});
describe("GET /api/users/:id", () => {
	it("returns the details of the user matching the id", async () => {
		const hashedPassword = await bcrypt.hash("securepassword", 10);

		const newUser = new User({
			username: "testuser",
			password: hashedPassword,
			shelves: [],
		});
		const savedUser = await newUser.save();

		const tokenUserDetails = {
			username: savedUser.username,
			user_id: savedUser._id,
		};

		const token = jwt.sign(tokenUserDetails, process.env.JWT_SECRET);
		const response = await request(app)
			.get(`/api/users/${savedUser._id}`)
			.set("Authorization", `Bearer ${token}`)
			.expect(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body.user).toBeInstanceOf(Object);
		expect(typeof response.body.user.username).toBe("string");
		expect(typeof response.body.user.password).toBe("string");
		expect(typeof response.body.user.created_at).toBe("string");
	});
});

//faker used to generate rand unique ISBNs
describe("POST /api/books", () => {
	it("returns 201 status code and returns the JSON of the book add to the collection", async () => {
		const newBook = {
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(10),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		};

		const response = await request(app)
			.post("/api/books")
			.send(newBook)
			.expect(201);
		expect(response.body).toHaveProperty("added_book");
		expect(response.body.added_book).toBeInstanceOf(Object);

		expect(typeof response.body.added_book.title).toBe("string");
		expect(typeof response.body.added_book.author).toBe("string");
		expect(typeof response.body.added_book.isbn).toBe("string");
		expect(typeof response.body.added_book.lccn).toBe("string");
		expect(typeof response.body.added_book.published).toBe("string");
		expect(typeof response.body.added_book.publisher).toBe("string");
		expect(response.body.added_book.genres).toBeInstanceOf(Array);
		expect(response.body.added_book.genres.length).toBeGreaterThan(0);
		expect(typeof response.body.added_book.cover).toBe("string");
	});
	it("returns 400 code when submitting request with missing data", async () => {
		const newBook = {
			title: "The Hitchhiker's Guide to the Galaxy",
			//author removed
			// author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(10),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		};
		const response = await request(app)
			.post("/api/books")
			.send(newBook)
			.expect(400);
		expect(response.body.message).toBe(
			"Book validation failed: author: Path `author` is required."
		);
	});
});

describe("GET /api/books", () => {
	it("returns an array of books", async () => {
		const response = await request(app).get("/api/books").expect(200);
		expect(response.body).toHaveProperty("books");
		expect(response.body.books).toBeInstanceOf(Array);
		response.body.books.forEach((book) => {
			expect(typeof book.title).toBe("string");
			expect(typeof book.author).toBe("string");
			expect(typeof book.isbn).toBe("string");
			expect(typeof book.published).toBe("string");
			expect(typeof book.publisher).toBe("string");
			expect(book.genres).toBeInstanceOf(Array);
			expect(book.genres.length).toBeGreaterThan(0);
			expect(typeof book.cover).toBe("string");
		});
	});
});

describe("GET /api/books/:isbn", () => {
	it("returns book when passed a valid isbn", async () => {
		const newBook = new Book({
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(8),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		});

		const savedBook = await newBook.save();

		const response = await request(app)
			.get(`/api/books/${savedBook.isbn}`)
			.expect(200);
		expect(response.body).toHaveProperty("book_found");
		const bookFound = response.body.book_found;
		expect(bookFound._id).toEqual(savedBook._id.toString());
		expect(bookFound.title).toEqual(savedBook.title);
		expect(bookFound.author).toEqual(savedBook.author);
		expect(bookFound.isbn).toEqual(savedBook.isbn);
		expect(new Date(bookFound.published).toISOString()).toEqual(
			savedBook.published.toISOString()
		);
		expect(bookFound.lccn).toEqual(savedBook.lccn);
		expect(bookFound.publisher).toEqual(savedBook.publisher);
		expect(bookFound.genres).toEqual(savedBook.genres);
		expect(bookFound.cover).toEqual(savedBook.cover);
		expect(new Date(bookFound.created_at).toISOString()).toEqual(
			savedBook.created_at.toISOString()
		);
		expect(bookFound.__v).toEqual(savedBook.__v);
	});
});

describe("GET /api/user/:id/shelves", () => {
	it("returns the users shelves", async () => {
		const newUser = new User({
			username: "testuser",
			password: "securepassword",
			shelves: [],
		});

		const savedUser = await newUser.save();

		const newShelf1 = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf1",
			books: [],
		});

		const savedShelf1 = await newShelf1.save();

		const newShelf2 = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf2",
			books: [],
		});

		const savedShelf2 = await newShelf2.save();

		savedUser.shelves.push(savedShelf1._id, savedShelf2._id);
		await savedUser.save();

		const id = savedUser._id;
		const response = await request(app)
			.get(`/api/users/${id}/shelves`)
			.expect(200);
		expect(response.body).toHaveProperty("shelves");
		expect(response.body.shelves.length).toBe(2);
		response.body.shelves.forEach((shelf) => {
			expect(shelf).toHaveProperty("user_id");
			expect(shelf).toHaveProperty("shelf_name");
			expect(shelf).toHaveProperty("books");
			expect(shelf.books).toBeInstanceOf(Array);
			// });
		});
	});
});

describe("POST /api/users/:id/shelves", () => {
	it("returns 201 status code and returns the JSON of the shelf add to the user", async () => {
		const newUser = new User({
			username: "testuser",
			password: "securepassword",
			shelves: [],
		});

		const savedUser = await newUser.save();

		const newShelf = {
			user_id: savedUser._id,
			shelf_name: "testshelf",
			books: [],
		};

		const response = await request(app)
			.post(`/api/users/${savedUser._id}/shelves`)
			.send(newShelf)
			.expect(201);
		expect(response.body).toHaveProperty("added_shelf");
		expect(response.body.added_shelf.user_id).toEqual(savedUser._id.toString());

		expect(typeof response.body.added_shelf.shelf_name).toBe("string");
		expect(response.body.added_shelf.books).toBeInstanceOf(Array);
	});
});

describe("PATCH /api/shelves/:shelfId", () => {
	it("returns 200 status code and returns the JSON of the book added to the shelf", async () => {
		const newUser = new User({
			username: "testuser",
			password: "securepassword",
			shelves: [],
		});

		const savedUser = await newUser.save();

		const newShelf = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf",
			books: [],
		});

		const savedShelf = await newShelf.save();

		const newBook = new Book({
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(10),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		});

		const savedBook = await newBook.save();

		const response = await request(app)
			.patch(`/api/shelves/${savedShelf._id}`)
			.send({ book_id: savedBook._id })
			.expect(200);
		expect(response.body).toHaveProperty("updated_shelf");
		expect(response.body.updated_shelf.user_id).toEqual(
			savedUser._id.toString()
		);

		expect(typeof response.body.updated_shelf.shelf_name).toBe("string");
		expect(typeof response.body.updated_shelf.books[0].added_at).toBe("string");

		expect(
			response.body.updated_shelf.books.some(
				(book) => book.book_id === savedBook._id.toString()
			)
		).toBe(true);
	});
});

describe("GET /api/users/:id/shelves/books", () => {
	it("returns 200 status and all the shelves and books from the user", async () => {
		const newBook = new Book({
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(10),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		});

		const savedBook = await newBook.save();

		const newUser = new User({
			username: "testuser",
			password: "securepassword",
			shelves: [],
		});

		const savedUser = await newUser.save();

		const newShelf1 = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf1",
			books: [{ book_id: savedBook._id, added_at: new Date() }],
		});

		const savedShelf1 = await newShelf1.save();

		const newShelf2 = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf2",
			books: [{ book_id: savedBook._id, added_at: new Date() }],
		});

		const savedShelf2 = await newShelf2.save();

		savedUser.shelves.push(savedShelf1._id, savedShelf2._id);
		await savedUser.save();

		const id = savedUser._id;
		const response = await request(app)
			.get(`/api/users/${id}/shelves/books`)
			.expect(200);
		expect(response.body).toHaveProperty("shelvedBooks");

		response.body.shelvedBooks.forEach((shelf) => {
			expect(shelf).toHaveProperty("books");
			expect(shelf.books).toBeInstanceOf(Array);
			shelf.books.forEach((bookEntry) => {
				expect(bookEntry).toHaveProperty("book_id");
				expect(bookEntry.book_id).toHaveProperty(
					"title",
					"The Hitchhiker's Guide to the Galaxy"
				);
				expect(bookEntry.book_id).toHaveProperty("author", "Douglas Adams");
				expect(bookEntry).toHaveProperty("added_at");
			});
		});
	});
});

describe("PATCH /api/users/:userId/shelves/books/:bookId", () => {
	it("return 200 status and json of the updated user book when passed one updated category", async () => {
		const updates = { reviews: "a review" };

		const newUser = new User({
			username: "testuser",
			password: "securepassword",
			shelves: [],
		});

		const savedUser = await newUser.save();

		const newBook = new Book({
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
			lccn: faker.string.numeric(10),
			published: "1979",
			publisher: "Pan Books",
			genres: ["Comedy", "Science Fiction"],
			cover: "https://covers.openlibrary.org/b/id/8594906-L.jpg",
		});

		const savedBook = await newBook.save();

		const newShelf = new Shelf({
			user_id: savedUser._id,
			shelf_name: "testshelf",
			books: [
				{
					book_id: savedBook._id,
					note: "",
					reviews: "",
					tags: [],
				},
			],
		});

		const savedShelf = await newShelf.save();
		const body = { updates, shelfId: savedShelf._id };

		const response = await request(app)
			.patch(`/api/users/${savedUser._id}/shelves/books/${savedBook._id}`)
			.send(body)
			.expect(200);
		expect(response.body).toHaveProperty("updated_book");
		expect(response.body.updated_book.reviews).toBe("a review");
		expect(response.body.updated_book.book_id).toEqual(
			savedShelf.books[0].book_id.toString()
		);
		expect(response.body.updated_book.reviews).toEqual(updates.reviews);
		expect(response.body.updated_book.tags).toEqual([]);
		expect(response.body.updated_book._id).toEqual(
			savedShelf.books[0]._id.toString()
		);
	});
});
describe("GET /otherEndpoint", () => {
	it("should return 404 when a call is made to an invalid endpoint", async () => {
		const response = await request(app).get(`/otherEndpoint`).expect(404);
		expect(response.body.message).toBe("Endpoint not found");
	});
});
