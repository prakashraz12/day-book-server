const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Khana = require("./model/khana");
const User = require("./model/user");
const Extra = require("./model/extraItem");
const cors = require("cors")
const moment = require('moment'); // Import the moment library

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://day:day@cluster0.vxtjnya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('connected', () => {
    console.log('Connected to MongoDB!');
});



app.post('/createKhana', async (req, res) => {
    try {
        const { quantity, userId, price, extraItems, otherItems } = req.body;
        if (!quantity || !userId || !price) {
            return res.status(400).json({ message: "Invalid data" });
        }

        let shift = "";

        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
console.log(currentHour)
        // Determine shift based on current time
        if (currentHour >= 6 && currentHour < 14) {
            shift = "morning";
        } else {
            shift = "evening";
        }


        const newKhana = new Khana({ quantity, price, extraItems, shift, otherItems, consumer: userId });
        await newKhana.save();

        const findUser = await User.findById(userId);
        
        findUser.khana.push(newKhana._id);
        await findUser.save();

        res.status(201).json({ message: "Khana added successfully!", success: true, newKhana });
    } catch (error) {
        res.status(500).send(error.message);
    }
});



// Create user
app.post('/createUser', async (req, res) => {
    try {
        const { name, phone } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ message: "name and phone is required" })
        }
        const findUser = await User.findOne({ phone });
        if (findUser) {
            return res.status(409).json({ message: "user already exist" })
        }

        const newUser = new User({ name, phone });
        await newUser.save();
        res.status(201).json({ message: "user created" });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(404).json({ message: "Phone number is required" })
        }

        const findUser = await User.findOne({ phone }).select("name phone userType");

        if (!findUser) {
            return res.status(404).json({ message: "user not found" })
        }

        res.status(200).json(findUser);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
// Create extra item
app.post('/createExtraItem', async (req, res) => {
    try {
        const { name, price } = req.body;

        const newExtraItem = new Extra({ name, price });
        await newExtraItem.save();
        res.status(201).json({ message: "extra item created" });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Delete extra item
// app.delete('/deleteExtraItem/:id', async (req, res) => {
//     try {
//         const id = req.params.id;
//         await ExtraItem.findByIdAndDelete(id);
//         res.send('Extra item deleted successfully.');
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// });

app.use("/getextra", async (req, res) => {
    try {
        const getExtraItems = await Extra.find();

        if (!getExtraItems) {
            return res.status(500).json({ message: "no found" })
        }

        res.status(200).json(getExtraItems)

    } catch (error) {
        res.status(500).json({ message: "something went wrog" });
    }
})
app.get("/dashboard", async (req, res) => {
    try {
        const users = await User.find({ userType: "User" }).populate({
            path: "khana",
            match: { isPaid: false }
        });

        // Initialize total amount
        let totalAmount = 0;
        let totalKhanaQuantity = 0;

        // Iterate over each user
        users.forEach(user => {
            // Iterate over each user's khana
            user.khana.forEach(khana => {
                // Calculate the total amount for the khana entry
                let khanaAmount = khana.quantity * khana.price;
                totalKhanaQuantity += khana.quantity;

                // If otherItems exist, add their amounts to the total amount
                if (khana.otherItems && khana.otherItems.length > 0) {
                    khana.otherItems.forEach(item => {
                        khanaAmount += item.amount;
                    });
                }

                // Add the khanaAmount to the total amount
                totalAmount += khanaAmount;
            });
        });

        // Send the total amount to the client
        res.json({ totalAmount, totalKhanaQuantity, users });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});


app.post("/paid", async (req, res) => {
    const currentDate = moment(); // Get current date
    const paymentDate = moment(currentDate).date(); // Get day of the month (payment date)

    try {
        const { userId } = req.body;

        // Find all Khana documents for the user until the payment date of the current month with isPaid set to false
        const unpaidKhana = await Khana.find({
            consumer: userId,
            createdAt: {
                $lt: moment(currentDate).date(paymentDate).toDate() // Set end date to the payment date of the current month
            },
            isPaid: false
        });

        // Update each found Khana document to set isPaid to true
        await Promise.all(unpaidKhana.map(async (khana) => {
            khana.isPaid = true;
            await khana.save(); // Save the updated document
        }));

        res.status(200).json({ message: "Dues successfully paid." });
    } catch (error) {
        console.error("Error paying dues:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get("/get/me/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(404).json({ message: "id is required" });
        }

        const findUser = await User.findById(id).populate({
            path: "khana",
            match: { isPaid: false }, // Filter khana where isPaid is false
            populate: { path: "otherItems" },
            populate:{path:"extraItems"} // Populate otherItems in khana
        });

        res.status(200).json({ user: findUser });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
