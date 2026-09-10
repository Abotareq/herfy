/**
 * Seeds the database with a small, coherent catalogue: users, categories,
 * stores and products.
 *
 *   node scripts/seed.js            insert, but refuse if data already exists
 *   node scripts/seed.js --reset    delete the four seeded collections first
 *
 * Reads DB_HOST the same way the app does. Documents are written with
 * insertMany, which skips the models' save hooks -- so slugs and password
 * hashes are built here explicitly, and no RAG embeddings are generated
 * (that path calls the OpenAI API once per document).
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import dotenv from "dotenv";

import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import Store from "../models/storeModel.js";
import Product from "../models/productModel.js";
import userRole from "../utils/user.role.js";

dotenv.config();

const RESET = process.argv.includes("--reset");
const PASSWORD = "Herfy@12345";

const IMAGES = [
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1759005473/herfy/acyvdfrh5xaxuoyqm1ho.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757757117/herfy/szkmesjuuapq1v6xaol0.png",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757757014/herfy/qzpjzfdproqei20enjqv.png",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757756850/herfy/caxumwh6iob7so3db4lh.png",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757754014/herfy/fpdvczvspka0efdm1vez.png",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757748430/herfy/wgvaufcnlma2orfwlopw.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757748429/herfy/htd87zguond9jsrguaxd.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717948/herfy/xlbxz9l0vl80qkbuxlzz.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717948/herfy/sqvrgexq9kbfjmmu4b3g.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717948/herfy/wqk65gbtuuobjyvbhfj5.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717492/herfy/kzmvjock3mrwwuq4brtj.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717492/herfy/gxcryaj6upffvm2bfjn3.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717105/herfy/tjkufjsclxgebvyb2frj.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757717105/herfy/ayzfvdvkj9fiyq7vhq6r.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757716326/herfy/mqbzbi78mnolygxkhydq.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757715206/herfy/w5gqofptlvmrew9zxhev.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757715206/herfy/kevcrf6dgc9xggrjivhe.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757715206/herfy/j8x2kduf5a5rfakxwfrl.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757714803/herfy/jn78oznnu7kdfsvch4jc.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757714802/herfy/gpothb4adcqdgnqkr8q8.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757713759/herfy/ngxebfxchs6aer3zdykb.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757713195/herfy/lkhlliaubbyhd8vatnjz.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757713194/herfy/hfpzkakxsjd7rpso3g4p.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757712023/herfy/tnmyfvptubb5ehqtxxoo.png",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757711746/herfy/o8yfh45vu88qpxjylzht.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757711746/herfy/sldedyzwgzkooaz898tg.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757711453/herfy/ykxklgx3gzxfn9iocajz.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757710281/herfy/dpsqwrhelhwoh694shkj.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757710280/herfy/xkmves4rxms4tdpqoskd.jpg",
  "https://res.cloudinary.com/dfg4uwokf/image/upload/v1757710280/herfy/ogl6icqrizajc7iievzw.jpg"
];

const pickImages = (i, n = 2) =>
  Array.from({ length: n }, (_, k) => IMAGES[(i * n + k) % IMAGES.length]);

const slug = (name) => slugify(name, { lower: true });
const oid = () => new mongoose.Types.ObjectId();

const CATEGORIES = [
  "Pottery & Ceramics",
  "Handmade Jewelry",
  "Textiles & Rugs",
  "Woodwork",
  "Leather Goods",
  "Glass & Lanterns",
];

const STORES = [
  {
    name: "Fustat Clay House",
    description: "Third-generation potters working out of Old Cairo.",
    city: "Cairo",
    street: "12 Al Fustat Street",
    postalCode: 11511,
    coordinates: [31.2306, 30.0059],
  },
  {
    name: "Nubian Threads",
    description: "Handwoven textiles and rugs from Aswan.",
    city: "Aswan",
    street: "4 Corniche El Nil",
    postalCode: 81511,
    coordinates: [32.8998, 24.0889],
  },
  {
    name: "Khan Silverworks",
    description: "Silversmiths in Khan El Khalili since 1974.",
    city: "Cairo",
    street: "8 Al Muizz Street",
    postalCode: 11511,
    coordinates: [31.262, 30.0477],
  },
];

// [name, storeIndex, categoryIndex, basePrice, discountPrice, description]
const PRODUCTS = [
  ["Glazed Terracotta Serving Bowl", 0, 0, 450, 380, "Hand-thrown bowl finished in a turquoise glaze."],
  ["Fustat Clay Water Jug", 0, 0, 320, 0, "Traditional qulla that keeps water cool without power."],
  ["Ceramic Mezze Plate Set", 0, 0, 780, 690, "Set of six painted plates for sharing."],
  ["Speckled Stoneware Mug", 0, 0, 180, 0, "Chunky mug with a raw clay foot."],
  ["Hand-Painted Tagine Pot", 0, 0, 950, 850, "Glazed lid and base, safe for stovetop use."],
  ["Aswan Kilim Runner", 1, 2, 1600, 1450, "Flat-woven wool runner in indigo and sand."],
  ["Nubian Cotton Throw", 1, 2, 890, 0, "Loom-woven cotton with hand-knotted fringe."],
  ["Embroidered Cushion Cover", 1, 2, 340, 290, "Cross-stitched panel on natural linen."],
  ["Handwoven Wool Rug", 1, 2, 3200, 2900, "Two by three metres, vegetable-dyed wool."],
  ["Striped Table Runner", 1, 2, 420, 0, "Cotton runner woven on a pit loom."],
  ["Filigree Silver Earrings", 2, 1, 720, 640, "Sterling silver drawn into fine filigree."],
  ["Hammered Silver Cuff", 2, 1, 1150, 0, "Solid cuff with a hand-hammered surface."],
  ["Beaded Statement Necklace", 2, 1, 560, 480, "Glass beads strung on waxed cotton."],
  ["Engraved Signet Ring", 2, 1, 980, 0, "Cast in silver and engraved to order."],
  ["Carved Olive Wood Bowl", 0, 3, 540, 0, "Turned from a single piece of olive wood."],
  ["Inlaid Wooden Jewelry Box", 0, 3, 1250, 1100, "Mother-of-pearl inlay over walnut."],
  ["Vegetable-Tanned Leather Satchel", 2, 4, 2400, 2150, "Full-grain leather, hand-stitched seams."],
  ["Tooled Leather Belt", 2, 4, 680, 0, "Hand-tooled and finished with a brass buckle."],
  ["Pierced Brass Lantern", 1, 5, 1350, 1200, "Fanoos casting patterned light."],
  ["Blown Glass Tea Set", 1, 5, 890, 0, "Six handblown glasses with a matching pot."],
];

const summary = {};

async function main() {
  if (!process.env.DB_HOST) throw new Error("DB_HOST is not set");

  await mongoose.connect(process.env.DB_HOST, { serverSelectionTimeoutMS: 15000 });
  console.log("connected to: " + mongoose.connection.name + "\n");

  const models = { User, Category, Store, Product };
  const counts = {};
  for (const [label, Model] of Object.entries(models)) {
    counts[label] = await Model.countDocuments();
  }
  const existing = Object.entries(counts).filter(([, n]) => n > 0);

  if (existing.length && !RESET) {
    console.log("Refusing to seed -- these collections already hold data:");
    for (const [label, n] of existing) console.log("  " + label + ": " + n);
    console.log("\nRe-run with --reset to delete them first.");
    return;
  }

  if (RESET) {
    for (const [label, Model] of Object.entries(models)) {
      const result = await Model.deleteMany({});
      console.log("cleared " + label + ": " + result.deletedCount);
    }
    console.log("");
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---- users ----
  const admin = {
    _id: oid(),
    userName: "herfy_admin",
    firstName: "Ahmad",
    lastName: "Tarek",
    email: "admin@herfy.test",
    password: passwordHash,
    phone: "01000000001",
    role: userRole.ADMIN,
    emailVerified: true,
    addresses: [],
  };

  const vendorNames = [
    ["Mona", "Abdel Aziz"],
    ["Youssef", "El Sayed"],
    ["Hala", "Mansour"],
  ];

  const vendors = STORES.map((store, i) => ({
    _id: oid(),
    userName: "vendor_" + slug(store.name).replace(/-/g, "_"),
    firstName: vendorNames[i][0],
    lastName: vendorNames[i][1],
    email: "vendor" + (i + 1) + "@herfy.test",
    password: passwordHash,
    phone: "0100000010" + (i + 1),
    role: userRole.VENDOR,
    emailVerified: true,
    storesCount: 1,
    addresses: [
      {
        buildingNo: 4 + i,
        street: store.street,
        city: store.city,
        governorate: store.city,
        country: "Egypt",
        addressType: "work",
        isDefault: true,
        postalCode: store.postalCode,
      },
    ],
  }));

  const customer = {
    _id: oid(),
    userName: "sara_customer",
    firstName: "Sara",
    lastName: "Ibrahim",
    email: "customer@herfy.test",
    password: passwordHash,
    phone: "01000000009",
    role: userRole.CUSTOMER,
    emailVerified: true,
    addresses: [
      {
        buildingNo: 17,
        street: "9 Road 9, Maadi",
        city: "Cairo",
        governorate: "Cairo",
        country: "Egypt",
        addressType: "home",
        isDefault: true,
        postalCode: 11728,
      },
    ],
  };

  await User.insertMany([admin, ...vendors, customer]);
  summary.users = 2 + vendors.length;

  // ---- categories ----
  const categories = CATEGORIES.map((name, i) => ({
    _id: oid(),
    name,
    slug: slug(name),
    parent: null,
    image: IMAGES[i % IMAGES.length],
    productCount: 0,
    storesCount: 0,
  }));
  await Category.insertMany(categories);
  summary.categories = categories.length;

  // ---- stores ----
  const stores = STORES.map((store, i) => ({
    _id: oid(),
    owner: vendors[i]._id,
    name: store.name,
    slug: slug(store.name),
    description: store.description,
    logoUrl: IMAGES[(i + 6) % IMAGES.length],
    status: "approved", // public listings filter on this
    location: { type: "Point", coordinates: store.coordinates },
    address: { city: store.city, postalCode: store.postalCode, street: store.street },
    policies: {
      shipping: "Ships within 3 business days, nationwide.",
      returns: "Returns accepted within 14 days, unused and in original packaging.",
    },
    productCount: 0,
    categorieCount: 0,
    ordersCount: 0,
    couponsUsed: 0,
    isDeleted: false,
  }));
  await Store.insertMany(stores);
  summary.stores = stores.length;

  // ---- products ----
  const now = Date.now();
  const products = PRODUCTS.map((row, i) => {
    const [name, storeIndex, categoryIndex, base, discount, description] = row;
    const doc = {
      _id: oid(),
      store: stores[storeIndex]._id,
      name,
      slug: slug(name),
      description,
      status: "approved", // public listings filter on this
      basePrice: base,
      discountPrice: discount,
      category: categories[categoryIndex]._id,
      images: pickImages(i),
      variants: [
        {
          name: "Size",
          isDeleted: false,
          options: [
            { value: "Small", priceModifier: 0, stock: 12, sku: slug(name).slice(0, 12) + "-s" },
            {
              value: "Large",
              priceModifier: Math.round(base * 0.2),
              stock: 6,
              sku: slug(name).slice(0, 12) + "-l",
            },
          ],
        },
      ],
      averageRating: 0,
      reviewCount: 0,
      createdBy: vendors[storeIndex]._id,
      isDeleted: false,
    };
    if (discount) {
      doc.discountStart = new Date(now - 86400000);
      doc.discountEnd = new Date(now + 30 * 86400000);
    }
    return doc;
  });
  await Product.insertMany(products);
  summary.products = products.length;

  // ---- denormalised counters the app reads ----
  for (const store of stores) {
    const mine = products.filter((p) => String(p.store) === String(store._id));
    await Store.updateOne(
      { _id: store._id },
      {
        productCount: mine.length,
        categorieCount: new Set(mine.map((p) => String(p.category))).size,
      },
    );
  }
  for (const category of categories) {
    const mine = products.filter((p) => String(p.category) === String(category._id));
    await Category.updateOne(
      { _id: category._id },
      {
        productCount: mine.length,
        storesCount: new Set(mine.map((p) => String(p.store))).size,
      },
    );
  }

  console.log("seeded:");
  for (const [key, value] of Object.entries(summary)) {
    console.log("  " + key + ": " + value);
  }
  console.log("\nlogin for any seeded account: " + PASSWORD);
  console.log("  admin@herfy.test / vendor1@herfy.test / customer@herfy.test");
}

main()
  .catch((err) => {
    console.error("\nseed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
