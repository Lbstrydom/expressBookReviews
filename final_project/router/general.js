const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required."});
  }

  if (!isValid(username)) {
    return res.status(409).json({message: "Username already exists."});
  }

  users.push({ username, password });
  return res.status(200).json({message: "User successfully registered. Now you can login."});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  new Promise((resolve, reject) => {
    resolve(books);
  }).then((result) => {
    return res.status(200).send(JSON.stringify(result, null, 4));
  }).catch((err) => {
    return res.status(500).json({message: "Error retrieving books."});
  });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject("Book not found for ISBN " + isbn);
    }
  }).then((book) => {
    return res.status(200).json(book);
  }).catch((err) => {
    return res.status(404).json({message: err});
  });
 });

// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;

  new Promise((resolve, reject) => {
    const matches = Object.keys(books)
      .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
      .map((isbn) => ({ isbn, ...books[isbn] }));

    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject("No books found for author " + author);
    }
  }).then((matches) => {
    return res.status(200).json({booksbyauthor: matches});
  }).catch((err) => {
    return res.status(404).json({message: err});
  });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;

  new Promise((resolve, reject) => {
    const matches = Object.keys(books)
      .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
      .map((isbn) => ({ isbn, ...books[isbn] }));

    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject("No books found with title " + title);
    }
  }).then((matches) => {
    return res.status(200).json({booksbytitle: matches});
  }).catch((err) => {
    return res.status(404).json({message: err});
  });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({message: "Book not found for ISBN " + isbn});
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;

// ---------------------------------------------------------------------------
// Task 10: Standalone Node.js/Axios client methods (run directly with `node
// router/general.js` while the Express server is running on port 5000).
// Not invoked when this module is required by index.js.
// ---------------------------------------------------------------------------
if (require.main === module) {
  const axios = require('axios');
  const BASE_URL = "http://localhost:5000";

  // Method 1: Get all books — async function using a callback
  async function getAllBooks(callback) {
    try {
      const response = await axios.get(`${BASE_URL}/`);
      callback(null, response.data);
    } catch (error) {
      callback(error, null);
    }
  }

  // Method 2: Search by ISBN — Promises
  function getBookByISBN(isbn) {
    return axios.get(`${BASE_URL}/isbn/${isbn}`)
      .then((response) => {
        console.log("Book details for ISBN " + isbn + ":\n", JSON.stringify(response.data, null, 2));
      })
      .catch((error) => {
        console.log("Error fetching book by ISBN:", error.message);
      });
  }

  // Method 3: Search by Author — Promises (async/await)
  async function getBookByAuthor(author) {
    try {
      const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
      console.log("Books by " + author + ":\n", JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log("Error fetching books by author:", error.message);
    }
  }

  // Method 4: Search by Title — Promises
  function getBookByTitle(title) {
    return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
      .then((response) => {
        console.log("Books titled '" + title + "':\n", JSON.stringify(response.data, null, 2));
      })
      .catch((error) => {
        console.log("Error fetching books by title:", error.message);
      });
  }

  (async () => {
    await new Promise((resolve) => {
      getAllBooks((err, data) => {
        if (err) console.log("Error fetching all books:", err.message);
        else console.log("All books:\n", JSON.stringify(data, null, 2));
        resolve();
      });
    });
    await getBookByISBN(1);
    await getBookByAuthor("Jane Austen");
    await getBookByTitle("Fairy tales");
  })();
}
