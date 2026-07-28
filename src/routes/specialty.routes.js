const express = require("express");

const {
  getSpecialties,
} = require("../controllers/specialty.controller");

const router = express.Router();

router.get("/", getSpecialties);

module.exports = router;