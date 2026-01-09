const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connection = require("./config/db.js");
const { notFound, errorHandler } = require("./middleware/errorhanler.js");
const customerRoutes = require("./routes/customerRoutes");
const expertRoutes = require("./routes/expertRoute");

dotenv.config();
const app = express();
connection();

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.use("/api/customers", customerRoutes);
app.use("/api/experts", expertRoutes);

app.use(notFound);
app.use(errorHandler);

let server = app.listen(process.env.BACKEND_PORT, () => {
  console.log(`Server is running on port ${process.env.BACKEND_PORT}`);
});

