const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- FOLDERS ----------

const dataFolder = path.join(__dirname, "data");
const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const bookingsFile = path.join(dataFolder, "bookings.json");

if (!fs.existsSync(bookingsFile)) {
    fs.writeFileSync(bookingsFile, "[]");
}


// ---------- STATIC FILES ----------

app.use("/uploads", express.static(uploadFolder));
app.use(express.static(__dirname));

// ---------- READ BOOKINGS ----------

function getBookings() {
    try {
        return JSON.parse(fs.readFileSync(bookingsFile, "utf8"));
    } catch {
        return [];
    }
}


// ---------- SAVE BOOKINGS ----------

function saveBookings(bookings) {
    fs.writeFileSync(
        bookingsFile,
        JSON.stringify(bookings, null, 2)
    );
}


// ---------- GENERATE BOOKING ID ----------

function generateBookingId() {
    const number =
        Math.floor(100000 + Math.random() * 900000);

    return `SS${number}`;
}


// ---------- CREATE BOOKING ----------

app.post("/api/bookings", (req, res) => {

    const {
        name,
        mobile,
        event,
        date,
        location,
        message
    } = req.body;

    if (!name || !mobile || !event || !date || !location) {

        return res.status(400).json({
            success: false,
            message: "Please fill all required fields."
        });

    }

    if (!/^[0-9]{10}$/.test(mobile)) {

        return res.status(400).json({
            success: false,
            message: "Invalid mobile number."
        });

    }

    const bookings = getBookings();

    const bookingId = generateBookingId();

    const booking = {

        bookingId,
        name,
        mobile,
        event,
        date,
        location,
        message: message || "",
        status: "Pending",
        createdAt: new Date().toISOString()

    };

    bookings.push(booking);

    saveBookings(bookings);


    // Create folder for this client's photos
    const clientFolder =
        path.join(uploadFolder, bookingId);

    if (!fs.existsSync(clientFolder)) {
        fs.mkdirSync(clientFolder);
    }


    res.json({
        success: true,
        message: "Booking created successfully.",
        booking
    });

});


// ---------- GET BOOKING ----------

app.get("/api/bookings/:bookingId", (req, res) => {

    const bookingId =
        req.params.bookingId.toUpperCase();

    const bookings = getBookings();

    const booking =
        bookings.find(
            item =>
                item.bookingId.toUpperCase() === bookingId
        );

    if (!booking) {

        return res.status(404).json({
            success: false,
            message: "Booking not found."
        });

    }

    res.json({
        success: true,
        booking
    });

});


// ---------- GET ALL BOOKINGS ----------

app.get("/api/bookings", (req, res) => {

    const bookings = getBookings();

    res.json({
        success: true,
        bookings: bookings
    });

});

// ---------- ADMIN LOGIN ----------

app.post("/api/admin/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username === "admin" &&
        password === "SS@1234"
    ) {

        return res.json({
            success: true,
            message: "Login successful"
        });

    }

    res.status(401).json({
        success: false,
        message: "Invalid username or password"
    });

});

// ---------- UPDATE BOOKING STATUS ----------

app.post("/api/bookings/:bookingId/status", (req, res) => {

    const bookingId =
        req.params.bookingId.toUpperCase();

    const { status } = req.body;

    const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {

        return res.status(400).json({
            success: false,
            message: "Invalid status."
        });

    }

    const bookings = getBookings();

    const booking = bookings.find(
        item =>
            item.bookingId.toUpperCase() === bookingId
    );

    if (!booking) {

        return res.status(404).json({
            success: false,
            message: "Booking not found."
        });

    }

    booking.status = status;

    saveBookings(bookings);

    res.json({
        success: true,
        message: "Booking status updated.",
        booking
    });

});

// ---------- UPLOAD SETTINGS ----------

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        const bookingId =
            req.params.bookingId.toUpperCase();

        const folder =
            path.join(uploadFolder, bookingId);

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, {
                recursive: true
            });
        }

        cb(null, folder);
    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(file.originalname);

        const filename =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, filename);
    }

});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 25 * 1024 * 1024
    }
});


// ---------- UPLOAD PHOTOS ----------

app.post(
    "/api/upload/:bookingId",
    upload.array("photos", 50),
    (req, res) => {

        const bookingId =
            req.params.bookingId.toUpperCase();

        const bookings = getBookings();

        const booking =
            bookings.find(
                item =>
                    item.bookingId.toUpperCase() === bookingId
            );


        if (!booking) {

            // Remove uploaded files if booking doesn't exist
            if (req.files) {

                req.files.forEach(file => {

                    try {
                        fs.unlinkSync(file.path);
                    } catch {}

                });

            }

            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });

        }


        const files = (req.files || []).map(file => ({
            filename: file.filename,
            url: `/uploads/${bookingId}/${file.filename}`
        }));


        res.json({
            success: true,
            message: "Photos uploaded successfully.",
            files
        });

    }
);


// ---------- LIST CLIENT PHOTOS ----------

app.get("/api/gallery/:bookingId", (req, res) => {

    const bookingId =
        req.params.bookingId.toUpperCase();

    const folder =
        path.join(uploadFolder, bookingId);


    if (!fs.existsSync(folder)) {

        return res.json({
            success: true,
            photos: []
        });

    }


    const files =
        fs.readdirSync(folder);


    const photos =
        files.map(file => ({
            filename: file,
            url: `/uploads/${bookingId}/${file}`
        }));


    res.json({
        success: true,
        photos
    });

});


// ---------- HOME TEST ----------

app.get("/", (req, res) => {

    res.send(`
        <h1>📸 SS Photography Backend Running</h1>
        <p>Server is working on port ${PORT}</p>
    `);

});


// ---------- ADMIN PAGE ----------

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});


    // ---------- START SERVER ----------

app.listen(PORT, () => {
    console.log("");
    console.log("==================================");
    console.log("📸 SS PHOTOGRAPHY BACKEND");
    console.log("==================================");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("==================================");
    console.log("");
});

// ---------- ADMIN LOGIN PAGE ----------

app.get("/admin-login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "admin-login.html"));
});

