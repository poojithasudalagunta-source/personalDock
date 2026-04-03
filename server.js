const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

/* ===============================
   CONNECT TO MONGODB
=============================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

/* ===============================
   MODELS
=============================== */

// USER
const User = mongoose.model("User", {
  name: String,
  username: String,
  password: String
});

// NOTES
const Note = mongoose.model("Note", {
  text: String,
  color: String,
  userId: String,
  pinned: { type: Boolean, default: false }   // ⭐ ADD THIS
});

app.post("/notes/pin", async (req, res) => {
  const { id, pinned, userId } = req.body;

  await Note.updateOne(
    { _id: id, userId },
    { pinned }
  );

  res.json({ success: true });
});

// DOCUMENTS
const Document = mongoose.model("Document", {
  name: String,
  size: String,
  url: String,
  userId: String   // ⭐ ADD THIS
});

// PRODUCTS (Pantry)
const Product = mongoose.model("Product", {
  name: String,
  category: String,
  expiry: String,
  userId: String
});

// PLANNER
const Planner = mongoose.model("Planner", {
  product: String,
  time: String,
  completed: { type: Boolean, default: false }, // ⭐ ADD
  userId: String
});

// ATTENDANCE
const Attendance = mongoose.model("Attendance", {
  product: String,
  time: String,
  date: String,
  completed: Boolean,
  userId: String
});

// KNOWLEDGE (Assistant)
const Knowledge = mongoose.model("Knowledge", {
  text: String,
  userId: String   
});

/* ===============================
   AUTH ROUTES
=============================== */

// 📝 SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.json({ success: false });
    }

    const user = new User({ name, username, password });
    await user.save();

    res.json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 🔐 LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user || user.password !== password) {
    return res.json({ success: false });
  }

  res.json({ success: true, user });
});

/* ===============================
   NOTES
=============================== */



app.get("/notes", async (req, res) => {

  const userId = req.query.userId;

  const notes = await Note.find({ userId }).sort({ pinned: -1 });

  res.json(notes);
});
app.post("/notes", async (req, res) => {

  try {
    console.log("Incoming note:", req.body); // debug

    const note = new Note(req.body);
    await note.save();

    res.json(note);

  } catch (err) {
    console.error("Error saving note:", err);
    res.status(500).json({ error: "Failed to save note" });
  }

});
app.post("/notes/delete", async (req, res) => {

  const { id, userId } = req.body;

  await Note.deleteOne({ _id: id, userId });

  res.json({ success: true });

});

app.post("/notes/edit", async (req, res) => {
  try {
    const { id, text, color, userId } = req.body;

    await Note.updateOne(
      { _id: id, userId },
      { text, color }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   DOCUMENTS (Library)
=============================== */

app.get("/documents", async (req, res) => {

  const userId = req.query.userId;

  const docs = await Document.find({ userId });

  res.json(docs);
});

app.post("/documents", async (req, res) => {
  const doc = new Document(req.body);
  await doc.save();
  res.json(doc);
});

/* ===============================
   PRODUCTS (Pantry)
=============================== */

app.get("/products", async (req, res) => {

  const userId = req.query.userId;

  const products = await Product.find({ userId });

  res.json(products);

});

app.post("/products", async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

app.post("/products/delete", async (req, res) => {
  await Product.deleteOne({
  name: req.body.name,
  userId: req.body.userId
});
  res.json({ success: true });
});

/* ===============================
   PLANNER
=============================== */

app.get("/planner", async (req, res) => {

  const userId = req.query.userId;

  const data = await Planner.find({ userId }).sort({ completed: 1 });
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
    time: req.body.time,
    userId: req.body.userId
  });
  res.json({ success: true });
});


/* ===============================
   ATTENDANCE
=============================== */

app.get("/attendance", async (req, res) => {

  const userId = req.query.userId;

  const data = await Attendance.find({ userId });

  res.json(data);

});

app.post("/attendance", async (req, res) => {

  const records = req.body.map(r => ({
    ...r,
    userId: r.userId   // ensure userId exists
  }));

  for (const record of records) {
  await Attendance.updateOne(
    {
      product: record.product,
      time: record.time,
      date: record.date,
      userId: record.userId
    },
    record,
    { upsert: true }
  );
}

  res.json({ success: true });

});

/* ===============================
   ASSISTANT (Knowledge)
=============================== */

app.get("/knowledge", async (req, res) => {

  const userId = req.query.userId;

  const data = await Knowledge.find({ userId });

  res.json(data);

});
app.post("/knowledge", async (req, res) => {

  try {
    const item = new Knowledge(req.body);

    await item.save();

    res.json(item);

  } catch (err) {
    console.error("Error saving knowledge:", err);
    res.status(500).json({ error: "Failed to save" });
  }

});

app.post("/knowledge/delete", async (req, res) => {

  await Knowledge.deleteOne({
    _id: req.body.id,
    userId: req.body.userId
  });

  res.json({ success: true });

});
app.post("/knowledge/edit", async (req, res) => {

  await Knowledge.updateOne(
    { _id: req.body.id, userId: req.body.userId },
    { text: req.body.text }
  );

  res.json({ success: true });

});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

