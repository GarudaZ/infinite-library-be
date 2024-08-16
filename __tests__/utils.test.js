const { ISBNConverter } = require("../utils");

describe("testing ISBN converter", () => {
	test("should return json matching passed ISBN 10 when passed a valid ISBN", () => {
		const ISBN = "1847941834";
		return ISBNConverter(ISBN).then((result) => {
			expect(result._body.isbn_10[0]).toEqual(ISBN);
		});
	});
});
