const express = require("express");

const eventsRoutes = require("./routes/events.routes");
const insightsRoutes = require("./routes/insights.routes");

const app = express();

app.use(express.json());
require("dotenv").config();

app.use("/api/events", eventsRoutes);
app.use("/api/insights", insightsRoutes);

module.exports = app;
