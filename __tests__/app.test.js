const request = require("supertest");
const app = require("../app");
const endpoints = require("../endpoints.json");
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

require("dotenv").config();

beforeEach(async () => {
	await mongoose.connect(process.env.MONGODB_CONNECTION);
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

describe("GET /api/users", () => {
	it("returns an array of users", async () => {
		const response = await request(app).get("/api/users").expect(200);
		expect(response.body).toHaveProperty("users");
		expect(response.body.users).toBeInstanceOf(Array);
	});
});

describe("GET /api/users/:id", () => {
	it("returns the details of the user matching the id", async () => {
		const response = await request(app)
			.get("/api/users/66bb5ea7136f48e2c37a3849")
			.expect(200);
		expect(response.body).toHaveProperty("user");
		expect(response.body.user).toBeInstanceOf(Object);
		expect(typeof response.body.user.username).toBe("string");
		expect(typeof response.body.user.password).toBe("string");
		expect(typeof response.body.user.created_at).toBe("string");
	});
});

//faker used to generate rand unique ISBNs
describe.skip("POST /api/books", () => {
	it("returns 201 status code and returns the JSON of the book add to the collection", async () => {
		const newBook = {
			title: "The Hitchhiker's Guide to the Galaxy",
			author: "Douglas Adams",
			isbn: faker.string.numeric(10),
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
		expect(typeof response.body.added_book.published).toBe("string");
		expect(typeof response.body.added_book.publisher).toBe("string");
		expect(response.body.added_book.genres).toBeInstanceOf(Array);
		expect(response.body.added_book.genres.length).toBeGreaterThan(0);
		expect(typeof response.body.added_book.cover).toBe("string");
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
