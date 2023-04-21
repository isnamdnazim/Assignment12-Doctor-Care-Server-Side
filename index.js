const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
var admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(
  "sk_test_51KoOHoDsZQSPcvi2UQv26munJlCUuUFXLARsDeledAAbExoPG36Bo5mM5o9VEZwggpfWpPRForMc0bCgThImXrkf00ZDWdOv0u"
);
const fileUpload = require("express-fileupload");
const port = process.env.PORT || 5003;
const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

//

const serviceAccount = require("./doctor-portal-firebase-adminSDK.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// db connection

const uri =
  "mongodb+srv://Doctors:L4qc0XnmMhcWnu5V@cluster0.ebl0t.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("doctorDb");
    const appointmentsCollection = database.collection(
      "appointmentsCollection"
    );
    const usersCollection = database.collection("users");
    const doctorsCollection = database.collection("doctors");
    const doctorCollection = database.collection("doctor");
    const serviceCollection = database.collection("serviceCollection");
    const paymentCollection = database.collection("paymentCollection");
    // get doctor
    app.get("/doctor", async (req, res) => {
      const cursor = doctorCollection.find({});
      const doctors = await cursor.toArray();
      res.json(doctors);
    });
    //get signle doctor
    app.get("/doctor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await doctorCollection.findOne(query);
      res.json(result);
    });
    //get services
    app.get("/service", async (req, res) => {
      const cursor = serviceCollection.find({});
      const service = await cursor.toArray();
      res.json(service);
    });

    // Doctors Collection 
    app.post("/doctors", async (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const phone = req.body.phone;
      const designation = req.body.designation;
      const role = req.body.role;
      const pic = req.files.image;
      const picData = pic.data;
      const encodePic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodePic, "base64");
      const doctor = {
        name,
        email,
        phone,
        designation,
        attendance: "Available",
        role,
        image: imageBuffer,
      };
      const result = await doctorCollection.insertOne(doctor);
      res.json(result);
    });
    // Service Collection
    app.post("/services", async (req, res) => {
      const name = req.body.name;
      const time = req.body.time;
      const price = req.body.price;
      const space = req.body.space;
      const pic = req.files.image;
      const picData = pic.data;
      const encodePic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodePic, "base64");
      const service = {
        name,
        time,
        space,
        price,
        image: imageBuffer,
      };
      const result = await serviceCollection.insertOne(service);
      res.json(result);
    });
    //delete service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/doctor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await doctorCollection.deleteOne(query);
      res.send(result);
    });
    //delete appoint from admin
    app.delete("/appoint/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentsCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.json(result);
    });
    //update service
    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedService.name,
          time: updatedService.time,
          space: updatedService.space,
          price: updatedService.price,
        },
      };
      const result = await serviceCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("updating", id);
      res.json(result);
    });
    //update doctor
    app.put("/updatDoctor/:id", async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const img = req.files.image;
      const picData = img.data;
      const encodePic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodePic, "base64");
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedService.name,
          email: updatedService.email,
          phone: updatedService.phone,
          designation: updatedService.designation,
          image: imageBuffer,
        },
      };
      console.log(updateDoc);
      const result = await doctorCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("updating", id);
      res.json(result);
    });
    //post appointment
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      // console.log(result);
      res.json(result);
    });
    //update after payment
    app.put("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await appointmentsCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    //get appoitment
    app.get("/appointments", verifyToken, async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      const query = { email: email, date: date };
      const cursor = appointmentsCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });
    // get payment by date
    app.get("/allpayments", verifyToken, async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      const query = { date: date };
      const cursor = paymentCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });
    //delete payment
    //delete service
    app.delete("/allpayments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await paymentCollection.deleteOne(query);
      res.send(result);
    });
    //get appointment with specific id
    app.get("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentsCollection.findOne(query);
      res.json(result);
    });
    // get all appointment
    app.get("/allappointment", async (req, res) => {
      const cursor = appointmentsCollection.find({});
      const allappointment = await cursor.toArray();
      res.json(allappointment);
    });
    //get all appoitmnets for admin
    app.get("/appoint", async (req, res) => {
      const date = new Date(req.query.date).toLocaleDateString();
      const query = { date: date };
      const cursor = appointmentsCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });
    //Update status
    app.put("/updateStatus/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "paid",
        },
      };
      const result = await appointmentsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //update attendance
    app.put("/attendDoctor", async (req, res) => {
      const id = req.body.id;
      const attendance = req.body.attendance;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          attendance: attendance,
        },
      };
      const result = await doctorCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //update doctor
    app.put("/updatDoctor/:id", async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const img = req.files.image;
      const picData = img.data;
      const encodePic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodePic, "base64");
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedService.name,
          email: updatedService.email,
          phone: updatedService.phone,
          designation: updatedService.designation,
          image: imageBuffer,
        },
      };
      console.log(updateDoc);
      const result = await doctorCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log("updating", id);
      res.json(result);
    });

    // make restricted menu
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    //for doctors only
    app.get("/doctors/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const doctor = await doctorCollection.findOne(query);
      let isDoctor = false;
      if (doctor?.role === "doctor") {
        isDoctor = true;
      }
      res.json({ doctor: isDoctor });
    });
    // add user to database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });
    // update user
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });
    //get users
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find({});
      const user = await cursor.toArray();
      res.json(user);
    });
    // add admin role
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = usersCollection.findOne({ email: requester });
        if (requesterAccount.role == "admin") {
          const filter = { email: user.email };
          const updateDoc = {
            $set: { role: "admin" },
          };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });
    // add doctors role
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const amount = paymentInfo.price * 100;
      const appointmentId = paymentInfo._id;
      const serviceName = paymentInfo.serviceName;
      const patientName = paymentInfo.patientName;
      const date = paymentInfo.date;
      const price = paymentInfo.price;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      console.log(paymentIntent);
      const payInfo = {
        appointmentId,
        serviceName,
        patientName,
        price,
        date,
        status: "paid",
      };
      const result = await paymentCollection.insertOne(payInfo);
      res.send({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`listening at Port :${port}`);
});

// //get users
// app.get("/users");

// //specific user
// app.get("/users/:id");
// app.post("/users");
// app.delete("/users/:id");
// //update
// app.put("/users/:id");
