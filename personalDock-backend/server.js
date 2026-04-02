const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
   CONNECT TO MONGODB
================================ */

mongoose.connect("mongodb://127.0.0.1:27017/personaldock");

mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
});

mongoose.connection.on("error", (err) => {
    console.log("MongoDB error:", err);
});

/* ===============================
   SCHEMAS
================================ */

const User = mongoose.model("User", {
    name: String,
    username: String,
    password: String
});

const Product = mongoose.model("Product", {
    name: String,
    category: String,
    expiry: String
});

const Planner = mongoose.model("Planner", {
    product: String,
    time: String
});

const Attendance = mongoose.model("Attendance", {
    product: String,
    time: String,
    date: String,
    completed: Boolean
});

const Document = mongoose.model("Document", {
    name: String,
    size: String,
    url: String
});

const Note = mongoose.model("Note", {
    text: String,
    color: String
});

const Knowledge = mongoose.model("Knowledge", {
    text: String
});

/* ===============================
   AUTH ROUTES
================================ */

app.post("/signup", async (req, res) => {

    try {

        const exists = await User.findOne({
            username: req.body.username
        });

        if (exists) {
            return res.json({ success: false, message: "User exists" });
        }

        const user = new User(req.body);
        await user.save();

        res.json({ success: true });

    } catch (err) {
        res.json({ success: false, error: err });
    }

});

app.post("/login", async (req, res) => {

    try {

        const user = await User.findOne({
            username: req.body.username,
            password: req.body.password
        });

        if (!user) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (err) {
        res.json({ success: false, error: err });
    }

});

/* ===============================
   PANTRY PRODUCTS
================================ */

app.get("/products", async (req, res) => {

    const data = await Product.find();
    res.json(data);

});

app.post("/products", async (req, res) => {

    const item = new Product(req.body);
    await item.save();

    res.json(item);

});

app.post("/products/delete", async (req, res) => {

    await Product.deleteOne({ name: req.body.name });

    res.json({ message: "Deleted" });

});

/* ===============================
   PLANNER ROUTINE
================================ */

app.get("/planner", async (req, res) => {

    const data = await Planner.find();
    res.json(data);

});

app.post("/planner", async (req, res) => {

    const item = new Planner(req.body);
    await item.save();

    res.json(item);

});

app.post("/planner/delete", async (req, res) => {

    await Planner.deleteOne({
        product: req.body.product,
        time: req.body.time
    });

    res.json({ message: "Deleted" });

});

/* ===============================
   ATTENDANCE
================================ */

app.get("/attendance", async (req, res) => {

    const data = await Attendance.find();
    res.json(data);

});

app.post("/attendance", async (req, res) => {

    const records = req.body;

    await Attendance.insertMany(records);

    res.json({ message: "Saved" });

});

/* ===============================
   DOCUMENTS
================================ */

app.get("/documents", async (req, res) => {

    const docs = await Document.find();
    res.json(docs);

});

app.post("/documents", async (req, res) => {

    const doc = new Document(req.body);
    await doc.save();

    res.json(doc);

});

/* ===============================
   NOTES
================================ */

app.get("/notes", async (req, res) => {

    const notes = await Note.find();
    res.json(notes);

});

app.post("/notes", async (req, res) => {

    const note = new Note(req.body);
    await note.save();

    res.json(note);

});

app.post("/notes/delete", async (req, res) => {

    await Note.findByIdAndDelete(req.body.id);

    res.json({ message: "Deleted" });

});

/* ===============================
   KNOWLEDGE BASE
================================ */

app.get("/knowledge", async (req, res) => {

    const data = await Knowledge.find();
    res.json(data);

});

app.post("/knowledge", async (req, res) => {

    const item = new Knowledge(req.body);
    await item.save();

    res.json(item);

});

app.post("/knowledge/delete", async (req, res) => {

    await Knowledge.findByIdAndDelete(req.body.id);

    res.json({ message: "Deleted" });

});

app.post("/knowledge/edit", async (req, res) => {

    await Knowledge.findByIdAndUpdate(
        req.body.id,
        { text: req.body.text }
    );

    res.json({ message: "Updated" });

});

/* ===============================
   START SERVER
================================ */

app.listen(5000, () => {

    console.log("Server running on port 5000");

});