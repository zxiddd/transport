import { Trailer, Driver, PartCatalogItem } from "@/types/workshop";

export interface TalaFleetRecord {
  sn: number;
  driverName: string;
  trailerNumber: string;
  loadDate: string;
  fromLocation: string;
  toLocation: string;
  status: "active" | "grounded";
  modelType: string;
  iqamaNumber: string;
  phone: string;
}

export const TALA_FLEET_50: TalaFleetRecord[] = [
  { sn: 1, trailerNumber: "1286", driverName: "Mohd Dilshad", loadDate: "20/09/2026", fromLocation: "Jeddah", toLocation: "9 am Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2458920194", phone: "+966 50 123 4567" },
  { sn: 2, trailerNumber: "1281", driverName: "Muhammad Shoaib", loadDate: "20/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Islamic Port", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2489102847", phone: "+966 50 234 5678" },
  { sn: 3, trailerNumber: "1287", driverName: "Mohsin Khan", loadDate: "21/09/2026", fromLocation: "Riyadh Yard", toLocation: "Dammam Port", status: "active", modelType: "Curtainside 40ft", iqamaNumber: "2410928374", phone: "+966 55 345 6789" },
  { sn: 4, trailerNumber: "8440", driverName: "Mohammad Afsar", loadDate: "21/09/2026", fromLocation: "Jeddah", toLocation: "Yanbu Port", status: "active", modelType: "Lowbed Heavy Hauler", iqamaNumber: "2439182740", phone: "+966 54 456 7890" },
  { sn: 5, trailerNumber: "6250", driverName: "Ariel", loadDate: "22/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2491028374", phone: "+966 56 567 8901" },
  { sn: 6, trailerNumber: "6249", driverName: "Roop Lal", loadDate: "22/09/2026", fromLocation: "Jeddah", toLocation: "King Abdulaziz Port Dammam", status: "active", modelType: "Container Chassis 40ft", iqamaNumber: "2401928374", phone: "+966 53 678 9012" },
  { sn: 7, trailerNumber: "7431", driverName: "Jatinder Roshan", loadDate: "22/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "grounded", modelType: "Flatbed 40ft", iqamaNumber: "2478192038", phone: "+966 51 789 0123" },
  { sn: 8, trailerNumber: "6243", driverName: "Ahmad Ibrahiem", loadDate: "23/09/2026", fromLocation: "Jeddah", toLocation: "Riyadh Dry Port", status: "active", modelType: "Tipper Trailer", iqamaNumber: "2489102938", phone: "+966 52 890 1234" },
  { sn: 9, trailerNumber: "4573", driverName: "Saleem Khan", loadDate: "23/09/2026", fromLocation: "Dammam Yard", toLocation: "Jubail Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2419203847", phone: "+966 57 901 2345" },
  { sn: 10, trailerNumber: "8425", driverName: "Mohammad Hanif", loadDate: "23/09/2026", fromLocation: "Jeddah", toLocation: "Rabigh Port", status: "active", modelType: "Tanker Trailer", iqamaNumber: "2409182736", phone: "+966 58 012 3456" },
  { sn: 11, trailerNumber: "4581", driverName: "Mohammed Najam", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Islamic Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2412345678", phone: "+966 50 111 2222" },
  { sn: 12, trailerNumber: "8426", driverName: "Nama Raj", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Port 9", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2423456789", phone: "+966 50 222 3333" },
  { sn: 13, trailerNumber: "8441", driverName: "Sunil K", loadDate: "24/09/2026", fromLocation: "Riyadh", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2434567890", phone: "+966 50 333 4444" },
  { sn: 14, trailerNumber: "4578", driverName: "Milan Bishwakarama", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "active", modelType: "Curtainside 40ft", iqamaNumber: "2445678901", phone: "+966 50 444 5555" },
  { sn: 15, trailerNumber: "8442", driverName: "Mohammad Ijlal", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Lowbed Heavy Hauler", iqamaNumber: "2456789012", phone: "+966 50 555 6666" },
  { sn: 16, trailerNumber: "4583", driverName: "Isarail Miya", loadDate: "24/09/2026", fromLocation: "Dammam", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2467890123", phone: "+966 50 666 7777" },
  { sn: 17, trailerNumber: "4904", driverName: "Mahebul Ansari", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Yanbu Port", status: "grounded", modelType: "Flatbed 40ft", iqamaNumber: "2478901234", phone: "+966 50 777 8888" },
  { sn: 18, trailerNumber: "6179", driverName: "Mohd Shahnavaz", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Container Chassis", iqamaNumber: "2489012345", phone: "+966 50 888 9999" },
  { sn: 19, trailerNumber: "6241", driverName: "Meraj Ali", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2490123456", phone: "+966 50 999 0000" },
  { sn: 20, trailerNumber: "7185", driverName: "Asim Khan", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Rabigh Port", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2401234567", phone: "+966 55 111 2222" },
  { sn: 21, trailerNumber: "1259", driverName: "Chandika Gole", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2411112223", phone: "+966 55 222 3333" },
  { sn: 22, trailerNumber: "4582", driverName: "Vetter", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2422223334", phone: "+966 55 333 4444" },
  { sn: 23, trailerNumber: "4571", driverName: "Haseeb", loadDate: "24/09/2026", fromLocation: "Riyadh Yard", toLocation: "Jeddah Port", status: "active", modelType: "Curtainside 40ft", iqamaNumber: "2433334445", phone: "+966 55 444 5555" },
  { sn: 24, trailerNumber: "8429", driverName: "Pawan Sardar", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2444445556", phone: "+966 55 555 6666" },
  { sn: 25, trailerNumber: "2297", driverName: "Rahul Kumar", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Lowbed Heavy Hauler", iqamaNumber: "2455556667", phone: "+966 55 666 7777" },
  { sn: 26, trailerNumber: "8437", driverName: "Abu Al Wafa", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Dammam Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2466667778", phone: "+966 55 777 8888" },
  { sn: 27, trailerNumber: "8438", driverName: "Hilal Shakil", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2477778889", phone: "+966 55 888 9999" },
  { sn: 28, trailerNumber: "7433", driverName: "Shakeel Khan", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2488889990", phone: "+966 55 999 0000" },
  { sn: 29, trailerNumber: "6245", driverName: "James", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2499990001", phone: "+966 54 111 2222" },
  { sn: 30, trailerNumber: "4580", driverName: "Sulav Kami", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Container Chassis", iqamaNumber: "2400001112", phone: "+966 54 222 3333" },
  { sn: 31, trailerNumber: "8428", driverName: "Mohammad Vasif", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2411113334", phone: "+966 54 333 4444" },
  { sn: 32, trailerNumber: "8424", driverName: "Jagdish Singh", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2422224445", phone: "+966 54 444 5555" },
  { sn: 33, trailerNumber: "8439", driverName: "Mohammad Ashhar", loadDate: "24/09/2026", fromLocation: "Riyadh", toLocation: "Jeddah Port", status: "active", modelType: "Curtainside 40ft", iqamaNumber: "2433335556", phone: "+966 54 555 6666" },
  { sn: 34, trailerNumber: "7430", driverName: "Jitan Thing", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2444446667", phone: "+966 54 666 7777" },
  { sn: 35, trailerNumber: "4042", driverName: "Jatinder Singh", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2455557778", phone: "+966 54 777 8888" },
  { sn: 36, trailerNumber: "7485", driverName: "Hom Bahadur", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2466668889", phone: "+966 54 888 9999" },
  { sn: 37, trailerNumber: "8443", driverName: "Dipak Khadka", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2477779990", phone: "+966 54 999 0000" },
  { sn: 38, trailerNumber: "8422", driverName: "Som Bahadur", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Lowbed Heavy Hauler", iqamaNumber: "2488880001", phone: "+966 53 111 2222" },
  { sn: 39, trailerNumber: "1283", driverName: "Khalid Hussian", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2499991112", phone: "+966 53 222 3333" },
  { sn: 40, trailerNumber: "8432", driverName: "Sanjay", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2400002223", phone: "+966 53 333 4444" },
  { sn: 41, trailerNumber: "4584", driverName: "Sanaur Rehman", loadDate: "24/09/2026", fromLocation: "Dammam", toLocation: "Jeddah Port", status: "active", modelType: "Curtainside 40ft", iqamaNumber: "2411114445", phone: "+966 53 444 5555" },
  { sn: 42, trailerNumber: "6172", driverName: "Baljit Singh", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2422225556", phone: "+966 53 555 6666" },
  { sn: 43, trailerNumber: "8434", driverName: "Gurjot Singh", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2433336667", phone: "+966 53 666 7777" },
  { sn: 44, trailerNumber: "8435", driverName: "Gupe Singh", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Container Chassis", iqamaNumber: "2444447778", phone: "+966 53 777 8888" },
  { sn: 45, trailerNumber: "6247", driverName: "Dastageer", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2455558889", phone: "+966 53 888 9999" },
  { sn: 46, trailerNumber: "8430", driverName: "Farzan Ahmad", loadDate: "24/09/2026", fromLocation: "Jeddah Yard", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2466669990", phone: "+966 53 999 0000" },
  { sn: 47, trailerNumber: "1290", driverName: "Gurpreet Singh", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Reefer 48ft", iqamaNumber: "2477770001", phone: "+966 52 111 2222" },
  { sn: 48, trailerNumber: "6169", driverName: "Ijaz Khan", loadDate: "24/09/2026", fromLocation: "Riyadh", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2488881112", phone: "+966 52 222 3333" },
  { sn: 49, trailerNumber: "7182", driverName: "Rasid Shamshad", loadDate: "24/09/2026", fromLocation: "Jeddah", toLocation: "Jeddah Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2499992223", phone: "+966 52 333 4444" },
  { sn: 50, trailerNumber: "4576", driverName: "Arif Akram", loadDate: "24/09/2026", fromLocation: "Jeddah Yard 3", toLocation: "Jeddah Islamic Port", status: "active", modelType: "Flatbed 40ft", iqamaNumber: "2400003334", phone: "+966 52 444 5555" },
];

export const SAUDI_HEAVY_PARTS_CATALOG: PartCatalogItem[] = [
  // Tires & Axles
  { id: "part-tire-315", companyId: "tala-transport", name: "Drive Tire 315/80 R22.5 (Bridgestone/Michelin)", category: "Tires", cooldownDays: 90, baselineCostSAR: 950 },
  { id: "part-tire-385", companyId: "tala-transport", name: "Trailer Super Single Tire 385/65 R22.5", category: "Tires", cooldownDays: 90, baselineCostSAR: 1250 },
  { id: "part-tire-retread", companyId: "tala-transport", name: "Trailer Retread Tire 315/80 R22.5", category: "Tires", cooldownDays: 60, baselineCostSAR: 480 },
  
  // Brakes & Braking System
  { id: "part-[#01]", companyId: "tala-transport", name: "Front Axle Heavy Brake Pads Set (KNORR / WABCO)", category: "Brakes", cooldownDays: 45, baselineCostSAR: 450 },
  { id: "part-[#02]", companyId: "tala-transport", name: "Rear Drum Brake Shoe Lining Set", category: "Brakes", cooldownDays: 45, baselineCostSAR: 380 },
  { id: "part-[#03]", companyId: "tala-transport", name: "Air Brake Booster Chamber (Type 30/30 Sealed)", category: "Brakes", cooldownDays: 60, baselineCostSAR: 320 },
  { id: "part-[#04]", companyId: "tala-transport", name: "Automatic Slack Adjuster (HALDEX Type)", category: "Brakes", cooldownDays: 60, baselineCostSAR: 290 },
  { id: "part-[#05]", companyId: "tala-transport", name: "ABS Wheel Speed Sensor & Cable Kit", category: "Brakes", cooldownDays: 30, baselineCostSAR: 180 },
  { id: "part-[#06]", companyId: "tala-transport", name: "Brake Disc Rotor 22.5 Heavy Duty", category: "Brakes", cooldownDays: 90, baselineCostSAR: 750 },

  // Suspension & Air Springs
  { id: "part-[#07]", companyId: "tala-transport", name: "Trailer Axle Air Spring Bellow Assembly (ContiTech 941 MB)", category: "Suspension", cooldownDays: 60, baselineCostSAR: 520 },
  { id: "part-[#08]", companyId: "tala-transport", name: "Leaf Spring Bushing & Pin Set (BPW / SAF Axle)", category: "Suspension", cooldownDays: 45, baselineCostSAR: 190 },
  { id: "part-[#09]", companyId: "tala-transport", name: "Heavy Duty Shock Absorber (SACHS / MONROE)", category: "Suspension", cooldownDays: 60, baselineCostSAR: 380 },
  { id: "part-[#10]", companyId: "tala-transport", name: "Torque Arm Bushing (Fixed & Adjustable)", category: "Suspension", cooldownDays: 45, baselineCostSAR: 220 },

  // Wheel Hubs, Bearings & Seals
  { id: "part-[#11]", companyId: "tala-transport", name: "Wheel Hub Bearing & Oil Seal Set (SKF / TIMKEN)", category: "Suspension", cooldownDays: 90, baselineCostSAR: 680 },
  { id: "part-[#12]", companyId: "tala-transport", name: "Wheel Stud Bolt & Heavy Nut Set (M22x1.5)", category: "Suspension", cooldownDays: 30, baselineCostSAR: 85 },
  { id: "part-[#13]", companyId: "tala-transport", name: "Axle Dust Cover Cap & Rubber Gasket", category: "Body", cooldownDays: 30, baselineCostSAR: 65 },

  // Coupling & Trailer Landing Gear
  { id: "part-[#14]", companyId: "tala-transport", name: "Trailer Kingpin 2-inch Heavy Duty (JOST / GF)", category: "Body", cooldownDays: 120, baselineCostSAR: 890 },
  { id: "part-[#15]", companyId: "tala-transport", name: "Trailer Landing Gear Leg Set 28-Ton Capacity (JOST)", category: "Body", cooldownDays: 180, baselineCostSAR: 2450 },
  { id: "part-[#16]", companyId: "tala-transport", name: "Fifth Wheel Rubber Cushion & Jaw Locking Kit", category: "Body", cooldownDays: 90, baselineCostSAR: 620 },
  { id: "part-[#17]", companyId: "tala-transport", name: "Container Twist Lock Assembly (JOST)", category: "Body", cooldownDays: 90, baselineCostSAR: 350 },

  // Electrical & Lighting
  { id: "part-[#18]", companyId: "tala-transport", name: "Trailer 7-Pin Electrical Coiled Cable Harness", category: "Other", cooldownDays: 30, baselineCostSAR: 140 },
  { id: "part-[#19]", companyId: "tala-transport", name: "LED Rear Tail Light Assembly 24V (Submersible)", category: "Other", cooldownDays: 30, baselineCostSAR: 175 },
  { id: "part-[#20]", companyId: "tala-transport", name: "Side Marker LED Amber Clearance Lamp Set", category: "Other", cooldownDays: 30, baselineCostSAR: 95 },

  // Engine Maintenance & Fluids
  { id: "part-[#21]", companyId: "tala-transport", name: "Heavy Duty Diesel Engine Oil 15W40 (20 Litres Mobil/Shell)", category: "Fluids", cooldownDays: 30, baselineCostSAR: 380 },
  { id: "part-[#22]", companyId: "tala-transport", name: "Fleet Diesel Fuel Filter & Water Separator (MANN)", category: "Fluids", cooldownDays: 30, baselineCostSAR: 145 },
  { id: "part-[#23]", companyId: "tala-transport", name: "Engine Air Filter Element Heavy Duty", category: "Fluids", cooldownDays: 30, baselineCostSAR: 210 },
  { id: "part-[#24]", companyId: "tala-transport", name: "Radiator Coolant Premix 50/50 (20 Litres)", category: "Fluids", cooldownDays: 60, baselineCostSAR: 160 },
  { id: "part-[#25]", companyId: "tala-transport", name: "Hydraulic Oil ISO VG 46 (20 Litres Tipper/Landing)", category: "Fluids", cooldownDays: 60, baselineCostSAR: 340 },
];

export function getTalaTrailers(companyId = "tala-transport"): Trailer[] {
  return TALA_FLEET_50.map((record) => ({
    id: `TR-${record.trailerNumber}`,
    companyId,
    plateNumber: record.trailerNumber,
    trailerNumber: record.trailerNumber,
    modelType: record.modelType,
    defaultDriverId: `driver-${record.trailerNumber}`,
    status: record.status,
    loadDate: record.loadDate,
    fromLocation: record.fromLocation,
    toLocation: record.toLocation,
    driverName: record.driverName,
    createdAt: new Date() as any,
  }));
}

export function getTalaDrivers(companyId = "tala-transport"): Driver[] {
  return TALA_FLEET_50.map((record) => ({
    id: `driver-${record.trailerNumber}`,
    companyId,
    fullName: record.driverName,
    iqamaNumber: record.iqamaNumber,
    phone: record.phone,
    assignedPlate: record.trailerNumber,
    trailerNumber: record.trailerNumber,
    loadDate: record.loadDate,
    fromLocation: record.fromLocation,
    toLocation: record.toLocation,
    status: record.status,
    createdAt: new Date() as any,
  }));
}
