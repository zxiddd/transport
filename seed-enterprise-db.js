const { MongoClient } = require("mongodb");

const uri =
  "mongodb://zaid:aP3vL_PNb0id8RqovRG_PGpJPGfZmtO8ckNG5n2zH2FLh75M@031cc2e8-d2e5-4b04-bb88-246d8bed10c5.nam5.firestore.goog:443/default?loadBalanced=true&tls=true&authMechanism=SCRAM-SHA-256&retryWrites=false";

const driversList = [
  { sn: 1, trailerNumber: "1286", driverName: "Mohd Dilshad", iqamaNumber: "2458920194", phone: "+966 50 123 4567" },
  { sn: 2, trailerNumber: "1281", driverName: "Muhammad Shoaib", iqamaNumber: "2489102847", phone: "+966 50 234 5678" },
  { sn: 3, trailerNumber: "1287", driverName: "Mohsin Khan", iqamaNumber: "2410928374", phone: "+966 55 345 6789" },
  { sn: 4, trailerNumber: "8440", driverName: "Mohammad Afsar", iqamaNumber: "2439182740", phone: "+966 54 456 7890" },
  { sn: 5, trailerNumber: "6250", driverName: "Ariel", iqamaNumber: "2491028374", phone: "+966 56 567 8901" },
  { sn: 6, trailerNumber: "6249", driverName: "Roop Lal", iqamaNumber: "2401928374", phone: "+966 53 678 9012" },
  { sn: 7, trailerNumber: "7431", driverName: "Jatinder Roshan", iqamaNumber: "2478192038", phone: "+966 51 789 0123" },
  { sn: 8, trailerNumber: "6243", driverName: "Ahmad Ibrahiem", iqamaNumber: "2489102938", phone: "+966 52 890 1234" },
  { sn: 9, trailerNumber: "4573", driverName: "Saleem Khan", iqamaNumber: "2419203847", phone: "+966 57 901 2345" },
  { sn: 10, trailerNumber: "8425", driverName: "Mohammad Hanif", iqamaNumber: "2409182736", phone: "+966 58 012 3456" },
  { sn: 11, trailerNumber: "4581", driverName: "Mohammed Najam", iqamaNumber: "2412345678", phone: "+966 50 111 2222" },
  { sn: 12, trailerNumber: "8426", driverName: "Nama Raj", iqamaNumber: "2423456789", phone: "+966 50 222 3333" },
  { sn: 13, trailerNumber: "8441", driverName: "Sunil K", iqamaNumber: "2434567890", phone: "+966 50 333 4444" },
  { sn: 14, trailerNumber: "4578", driverName: "Milan Bishwakarama", iqamaNumber: "2445678901", phone: "+966 50 444 5555" },
  { sn: 15, trailerNumber: "8442", driverName: "Mohammad Ijlal", iqamaNumber: "2456789012", phone: "+966 50 555 6666" },
  { sn: 16, trailerNumber: "4583", driverName: "Isarail Miya", iqamaNumber: "2467890123", phone: "+966 50 666 7777" },
  { sn: 17, trailerNumber: "4904", driverName: "Mahebul Ansari", iqamaNumber: "2478901234", phone: "+966 50 777 8888" },
  { sn: 18, trailerNumber: "6179", driverName: "Mohd Shahnavaz", iqamaNumber: "2489012345", phone: "+966 50 888 9999" },
  { sn: 19, trailerNumber: "6241", driverName: "Meraj Ali", iqamaNumber: "2490123456", phone: "+966 50 999 0000" },
  { sn: 20, trailerNumber: "7185", driverName: "Asim Khan", iqamaNumber: "2401234567", phone: "+966 55 111 2222" },
  { sn: 21, trailerNumber: "1259", driverName: "Chandika Gole", iqamaNumber: "2411112223", phone: "+966 55 222 3333" },
  { sn: 22, trailerNumber: "4582", driverName: "Vetter", iqamaNumber: "2422223334", phone: "+966 55 333 4444" },
  { sn: 23, trailerNumber: "4571", driverName: "Haseeb", iqamaNumber: "2433334445", phone: "+966 55 444 5555" },
  { sn: 24, trailerNumber: "8429", driverName: "Pawan Sardar", iqamaNumber: "2444445556", phone: "+966 55 555 6666" },
  { sn: 25, trailerNumber: "2297", driverName: "Rahul Kumar", iqamaNumber: "2455556667", phone: "+966 55 666 7777" },
  { sn: 26, trailerNumber: "8437", driverName: "Abu Al Wafa", iqamaNumber: "2466667778", phone: "+966 55 777 8888" },
  { sn: 27, trailerNumber: "8438", driverName: "Hilal Shakil", iqamaNumber: "2477778889", phone: "+966 55 888 9999" },
  { sn: 28, trailerNumber: "7433", driverName: "Shakeel Khan", iqamaNumber: "2488889990", phone: "+966 55 999 0000" },
  { sn: 29, trailerNumber: "6245", driverName: "James", iqamaNumber: "2499990001", phone: "+966 54 111 2222" },
  { sn: 30, trailerNumber: "4580", driverName: "Sulav Kami", iqamaNumber: "2400001112", phone: "+966 54 222 3333" },
  { sn: 31, trailerNumber: "8428", driverName: "Mohammad Vasif", iqamaNumber: "2411113334", phone: "+966 54 333 4444" },
  { sn: 32, trailerNumber: "8424", driverName: "Jagdish Singh", iqamaNumber: "2422224445", phone: "+966 54 444 5555" },
  { sn: 33, trailerNumber: "8439", driverName: "Mohammad Ashhar", iqamaNumber: "2433335556", phone: "+966 54 555 6666" },
  { sn: 34, trailerNumber: "7430", driverName: "Jitan Thing", iqamaNumber: "2444446667", phone: "+966 54 666 7777" },
  { sn: 35, trailerNumber: "4042", driverName: "Jatinder Singh", iqamaNumber: "2455557778", phone: "+966 54 777 8888" },
  { sn: 36, trailerNumber: "7485", driverName: "Hom Bahadur", iqamaNumber: "2466668889", phone: "+966 54 888 9999" },
  { sn: 37, trailerNumber: "8443", driverName: "Dipak Khadka", iqamaNumber: "2477779990", phone: "+966 54 999 0000" },
  { sn: 38, trailerNumber: "8422", driverName: "Som Bahadur", iqamaNumber: "2488880001", phone: "+966 53 111 2222" },
  { sn: 39, trailerNumber: "1283", driverName: "Khalid Hussian", iqamaNumber: "2499991112", phone: "+966 53 222 3333" },
  { sn: 40, trailerNumber: "8432", driverName: "Sanjay", iqamaNumber: "2400002223", phone: "+966 53 333 4444" },
  { sn: 41, trailerNumber: "4584", driverName: "Sanaur Rehman", iqamaNumber: "2411114445", phone: "+966 53 444 5555" },
  { sn: 42, trailerNumber: "6172", driverName: "Baljit Singh", iqamaNumber: "2422225556", phone: "+966 53 555 6666" },
  { sn: 43, trailerNumber: "8434", driverName: "Gurjot Singh", iqamaNumber: "2433336667", phone: "+966 53 666 7777" },
  { sn: 44, trailerNumber: "8435", driverName: "Gupe Singh", iqamaNumber: "2444447778", phone: "+966 53 777 8888" },
  { sn: 45, trailerNumber: "6247", driverName: "Dastageer", iqamaNumber: "2455558889", phone: "+966 53 888 9999" },
  { sn: 46, trailerNumber: "8430", driverName: "Farzan Ahmad", iqamaNumber: "2466669990", phone: "+966 53 999 0000" },
  { sn: 47, trailerNumber: "1290", driverName: "Gurpreet Singh", iqamaNumber: "2477770001", phone: "+966 52 111 2222" },
  { sn: 48, trailerNumber: "6169", driverName: "Ijaz Khan", iqamaNumber: "2488881112", phone: "+966 52 222 3333" },
  { sn: 49, trailerNumber: "7182", driverName: "Rasid Shamshad", iqamaNumber: "2499992223", phone: "+966 52 333 4444" },
  { sn: 50, trailerNumber: "4576", driverName: "Arif Akram", iqamaNumber: "2400003334", phone: "+966 52 444 5555" },
];

const heavyParts = [
  { _id: "part-tire-315", name: "Drive Tire 315/80 R22.5 (Bridgestone/Michelin)", category: "Tires", cooldownDays: 90, baselineCostSAR: 950 },
  { _id: "part-tire-385", name: "Trailer Super Single Tire 385/65 R22.5", category: "Tires", cooldownDays: 90, baselineCostSAR: 1250 },
  { _id: "part-tire-retread", name: "Trailer Retread Tire 315/80 R22.5", category: "Tires", cooldownDays: 60, baselineCostSAR: 480 },
  { _id: "part-brake-pads", name: "Front Axle Heavy Brake Pads Set (KNORR / WABCO)", category: "Brakes", cooldownDays: 45, baselineCostSAR: 450 },
  { _id: "part-brake-shoe", name: "Rear Drum Brake Shoe Lining Set", category: "Brakes", cooldownDays: 45, baselineCostSAR: 380 },
  { _id: "part-brake-booster", name: "Air Brake Booster Chamber (Type 30/30 Sealed)", category: "Brakes", cooldownDays: 60, baselineCostSAR: 320 },
  { _id: "part-slack-adjuster", name: "Automatic Slack Adjuster (HALDEX Type)", category: "Brakes", cooldownDays: 60, baselineCostSAR: 290 },
  { _id: "part-abs-sensor", name: "ABS Wheel Speed Sensor & Cable Kit", category: "Brakes", cooldownDays: 30, baselineCostSAR: 180 },
  { _id: "part-brake-disc", name: "Brake Disc Rotor 22.5 Heavy Duty", category: "Brakes", cooldownDays: 90, baselineCostSAR: 750 },
  { _id: "part-air-bellow", name: "Trailer Axle Air Spring Bellow Assembly (ContiTech)", category: "Suspension", cooldownDays: 60, baselineCostSAR: 520 },
  { _id: "part-spring-bushing", name: "Leaf Spring Bushing & Pin Set (BPW / SAF Axle)", category: "Suspension", cooldownDays: 45, baselineCostSAR: 190 },
  { _id: "part-shock-absorber", name: "Heavy Duty Shock Absorber (SACHS / MONROE)", category: "Suspension", cooldownDays: 60, baselineCostSAR: 380 },
  { _id: "part-torque-arm", name: "Torque Arm Bushing (Fixed & Adjustable)", category: "Suspension", cooldownDays: 45, baselineCostSAR: 220 },
  { _id: "part-hub-bearing", name: "Wheel Hub Bearing & Oil Seal Set (SKF / TIMKEN)", category: "Suspension", cooldownDays: 90, baselineCostSAR: 680 },
  { _id: "part-wheel-studs", name: "Wheel Stud Bolt & Heavy Nut Set (M22x1.5)", category: "Suspension", cooldownDays: 30, baselineCostSAR: 85 },
  { _id: "part-dust-cap", name: "Axle Dust Cover Cap & Rubber Gasket", category: "Body", cooldownDays: 30, baselineCostSAR: 65 },
  { _id: "part-kingpin", name: "Trailer Kingpin 2-inch Heavy Duty (JOST / GF)", category: "Body", cooldownDays: 120, baselineCostSAR: 890 },
  { _id: "part-landing-gear", name: "Trailer Landing Gear Leg Set 28-Ton Capacity (JOST)", category: "Body", cooldownDays: 180, baselineCostSAR: 2450 },
  { _id: "part-fifth-wheel-jaw", name: "Fifth Wheel Rubber Cushion & Jaw Locking Kit", category: "Body", cooldownDays: 90, baselineCostSAR: 620 },
  { _id: "part-twist-lock", name: "Container Twist Lock Assembly (JOST)", category: "Body", cooldownDays: 90, baselineCostSAR: 350 },
  { _id: "part-7pin-cable", name: "Trailer 7-Pin Electrical Coiled Cable Harness", category: "Other", cooldownDays: 30, baselineCostSAR: 140 },
  { _id: "part-tail-light", name: "LED Rear Tail Light Assembly 24V (Submersible)", category: "Other", cooldownDays: 30, baselineCostSAR: 175 },
  { _id: "part-side-marker", name: "Side Marker LED Amber Clearance Lamp Set", category: "Other", cooldownDays: 30, baselineCostSAR: 95 },
  { _id: "part-engine-oil", name: "Heavy Duty Diesel Engine Oil 15W40 (20 Litres)", category: "Fluids", cooldownDays: 30, baselineCostSAR: 380 },
  { _id: "part-fuel-filter", name: "Fleet Diesel Fuel Filter & Water Separator (MANN)", category: "Fluids", cooldownDays: 30, baselineCostSAR: 145 },
  { _id: "part-air-filter", name: "Engine Air Filter Element Heavy Duty", category: "Fluids", cooldownDays: 30, baselineCostSAR: 210 },
  { _id: "part-coolant", name: "Radiator Coolant Premix 50/50 (20 Litres)", category: "Fluids", cooldownDays: 60, baselineCostSAR: 160 },
  { _id: "part-hydraulic-oil", name: "Hydraulic Oil ISO VG 46 (20 Litres)", category: "Fluids", cooldownDays: 60, baselineCostSAR: 340 },
];

const targetCompanyIds = [
  "tala-transport",
  "cid_testgmailcom",
  "cid_testgmail",
  "z-transport-default",
];

const client = new MongoClient(uri);

async function seedEnterpriseDb() {
  try {
    console.log("Connecting to Enterprise Firestore Database...");
    await client.connect();
    console.log("✅ CONNECTED TO ENTERPRISE FIRESTORE!");

    const db = client.db();

    // 1. Seed Company Profiles
    for (const cid of targetCompanyIds) {
      await db.collection("companies").updateOne(
        { _id: cid },
        {
          $set: {
            id: cid,
            name: "Tala Transport Management",
            branch: "Jeddah Fleet Yard 3",
            currency: "SAR",
            vatEnabled: true,
            vatRatePercentage: 15,
            managerPin: "7788",
            userEmail: "test@gmail.com",
            hasCompletedOnboarding: true,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }
    console.log("✅ Company profiles created for test@gmail.com!");

    // 2. Seed 50 Drivers & Trailers
    console.log("Pushing 50 Drivers & Trailers to Database...");
    for (const item of driversList) {
      const trailerDocId = `TR-${item.trailerNumber}`;
      const driverDocId = `driver-${item.trailerNumber}`;

      const trailerData = {
        id: trailerDocId,
        trailerNumber: item.trailerNumber,
        plateNumber: item.trailerNumber,
        driverName: item.driverName,
        iqamaNumber: item.iqamaNumber,
        phone: item.phone,
        status: item.sn === 7 || item.sn === 17 ? "grounded" : "active",
        modelType: item.sn % 3 === 0 ? "Reefer 48ft" : item.sn % 5 === 0 ? "Curtainside 40ft" : "Flatbed 40ft",
        fromLocation: "Jeddah",
        toLocation: item.sn % 2 === 0 ? "9 am Port" : "Jeddah Islamic Port",
        loadDate: "24/09/2026",
        companyId: "tala-transport",
        updatedAt: new Date(),
      };

      await db.collection("trailers").updateOne(
        { _id: trailerDocId },
        { $set: trailerData },
        { upsert: true }
      );

      await db.collection("drivers").updateOne(
        { _id: driverDocId },
        { $set: { id: driverDocId, fullName: item.driverName, assignedPlate: item.trailerNumber, iqamaNumber: item.iqamaNumber, phone: item.phone, companyId: "tala-transport" } },
        { upsert: true }
      );
    }
    console.log("✅ 50 Drivers & Trailers successfully pushed!");

    // 3. Seed Saudi Heavy Truck & Trailer Parts Catalog
    console.log("Pushing 28 Heavy Saudi Truck & Trailer Parts to Catalog...");
    for (const p of heavyParts) {
      await db.collection("part_catalog").updateOne(
        { _id: p._id },
        { $set: { ...p, companyId: "tala-transport", updatedAt: new Date() } },
        { upsert: true }
      );
    }
    console.log("✅ Heavy Saudi Parts Catalog successfully pushed!");

    const cols = await db.listCollections().toArray();
    console.log("🎉 ENTERPRISE FIRESTORE DATABASE COLLECTIONS:", cols.map((c) => c.name));
  } catch (err) {
    console.error("❌ SEED ERROR:", err);
  } finally {
    await client.close();
  }
}

seedEnterpriseDb();
