const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return users.filter((user) => user.username === username).length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.filter((user) => user.username === username && user.password === password).length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({message: "Username and password are required."});
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid username or password."});
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({message: "User successfully logged in.", accessToken});
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({message: "User not logged in."});
  }

  if (!review) {
    return res.status(400).json({message: "Review text is required as a query parameter, e.g. ?review=..."});
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({message: "Book not found for ISBN " + isbn});
  }

  const isNewReview = !book.reviews[username];
  book.reviews[username] = review;

  return res.status(200).json({
    message: (isNewReview ? "Review successfully added" : "Review successfully modified") + " for ISBN " + isbn,
    reviews: book.reviews
  });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({message: "User not logged in."});
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({message: "Book not found for ISBN " + isbn});
  }

  if (!book.reviews[username]) {
    return res.status(404).json({message: "No review by this user found for ISBN " + isbn});
  }

  delete book.reviews[username];

  return res.status(200).json({message: "Review successfully deleted for ISBN " + isbn, reviews: book.reviews});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
