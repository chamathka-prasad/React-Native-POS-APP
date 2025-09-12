import * as SQLite from 'expo-sqlite'; // Use namespace import
import { Platform } from 'react-native';

const DATABASE_NAME = 'products.db';

// --- Database Connection Holder ---
let dbInstance = null;

// --- Get/Open Database Connection ---
const getDbConnection = async () => {
    if (dbInstance) {
        return dbInstance;
    }
    if (Platform.OS === "web") {
        console.warn("SQLite operations are mocked on web.");
        dbInstance = { /* Mock object needed */ };
        return dbInstance;
    }
    try {
        console.log("Opening database connection...");
        dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
        console.log("SQLite database opened successfully:", DATABASE_NAME);
        return dbInstance;
    } catch (error) {
        console.error("Failed to open database:", error);
        throw new Error("Failed to open database connection.");
    }
};


// --- Initialize Database ---
export const initDatabase = async () => {
    try {
        const db = await getDbConnection();
        // Use execAsync for multiple statements separated by semicolons
        await db.execAsync(`
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY NOT NULL,
                name TEXT,
                qty INTEGER NOT NULL,
                price REAL NOT NULL,
                imageUri TEXT,
                registeredDate TEXT NOT NULL,
                updatedDate TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bills (
                bill_id INTEGER PRIMARY KEY NOT NULL, -- Use timestamp as bill ID
                date TEXT NOT NULL,
                subtotal REAL NOT NULL,
                discount REAL DEFAULT 0,
                final_total REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bill_items (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto incrementing ID for each line item
                bill_id_fk INTEGER NOT NULL, -- Foreign key to bills table
                product_id_fk INTEGER NOT NULL, -- Foreign key to products table (or store product details directly)
                product_name TEXT, -- Store name at time of sale
                price_at_sale REAL NOT NULL, -- Store price at time of sale
                quantity INTEGER NOT NULL,
                item_total REAL NOT NULL,
                FOREIGN KEY (bill_id_fk) REFERENCES bills (bill_id) ON DELETE CASCADE, -- Optional: cascade delete
                FOREIGN KEY (product_id_fk) REFERENCES products (id) -- Optional: link to product, might be null if product deleted
            );
        `);
        console.log("Database tables initialized successfully.");
    } catch (error) {
        console.error("Error initializing database tables:", error);
        throw error;
    }
};

// --- Add Product ---
export const addProduct = async (id, name, qty, price, imageUri) => {
    try {
        const db = await getDbConnection();
        const registeredDate = new Date().toISOString();
        const updatedDate = registeredDate;
        const result = await db.runAsync(
            `INSERT INTO products (id, name, qty, price, imageUri, registeredDate, updatedDate) VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [id, name || null, qty, price, imageUri || null, registeredDate, updatedDate]
        );
        console.log("Product added successfully:", `ID: ${id}, Changes: ${result.changes}`);
        return result;
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
};

// --- Get All Products ---
export const getAllProducts = async () => {
    try {
        const db = await getDbConnection();
        const allRows = await db.getAllAsync(
            `SELECT * FROM products ORDER BY updatedDate DESC;`
        );
        console.log("Fetched all products successfully.");
        return allRows;
    } catch (error) {
        console.error("Error fetching all products:", error);
        throw error;
    }
};

// --- Get Product By ID ---
export const getProductById = async (id) => {
    const numericId = parseInt(id, 10);
     if (isNaN(numericId)) {
        console.log(`Invalid non-numeric ID received: ${id}`);
        return null;
    }
    try {
        const db = await getDbConnection();
        const firstRow = await db.getFirstAsync(
            `SELECT * FROM products WHERE id = ?;`,
            [numericId]
        );
        if (firstRow) {
            console.log(`Fetched product with id ${numericId} successfully.`);
        } else {
            console.log(`No product found with id ${numericId}.`);
        }
        return firstRow;
    } catch (error) {
        console.error(`Error fetching product with id ${numericId}:`, error);
        throw error;
    }
};

// --- Update Product ---
export const updateProduct = async (id, name, qty, price /*, imageUri */) => {
    try {
        const db = await getDbConnection();
        const updatedDate = new Date().toISOString();
        const result = await db.runAsync(
            `UPDATE products SET name = ?, qty = ?, price = ?, updatedDate = ? WHERE id = ?;`,
            [name || null, qty, price, updatedDate, id]
        );
        console.log(`Product ${id} updated. Changes: ${result.changes}`);
        if (result.changes === 0) {
            console.warn(`Attempted to update product ${id}, but no rows were affected.`);
        }
        return result;
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        throw error;
    }
};

// --- Decrease Product Quantity ---
export const decreaseProductQuantity = async (productId, quantityToDecrease) => {
    try {
        const db = await getDbConnection();
        const updatedDate = new Date().toISOString();
        // Subtract quantity, ensuring it doesn't go below zero (using MAX)
        const result = await db.runAsync(
            `UPDATE products SET qty = MAX(0, qty - ?), updatedDate = ? WHERE id = ?;`,
            [quantityToDecrease, updatedDate, productId]
        );
        console.log(`Decreased qty for product ${productId} by ${quantityToDecrease}. Changes: ${result.changes}`);
        if (result.changes === 0) {
            console.warn(`Attempted to decrease qty for product ${productId}, but ID was not found.`);
        }
        return result;
    } catch (error) {
        console.error(`Error decreasing quantity for product ${productId}:`, error);
        throw error;
    }
};


// --- Save Bill and Items ---
export const saveBill = async (billData) => {
    const { items, subtotal, discount, finalTotal } = billData;
    const bill_id = Date.now();
    const date = new Date().toISOString();
    try {
        const db = await getDbConnection();
        console.log(`Saving bill ${bill_id}...`);
        const billResult = await db.runAsync(
            `INSERT INTO bills (bill_id, date, subtotal, discount, final_total) VALUES (?, ?, ?, ?, ?);`,
            [bill_id, date, subtotal, discount, finalTotal]
        );
        console.log(`Bill ${bill_id} saved. Changes: ${billResult.changes}`);
        if (billResult.changes === 0) throw new Error("Failed to insert bill header.");
        for (const item of items) {
            const { product, qty, itemTotal } = item;
            await db.runAsync(
                `INSERT INTO bill_items (bill_id_fk, product_id_fk, product_name, price_at_sale, quantity, item_total) VALUES (?, ?, ?, ?, ?, ?);`,
                [bill_id, product.id, product.name || null, product.price, qty, itemTotal]
            );
        }
        console.log(`Saved ${items.length} items for bill ${bill_id}.`);
        return { bill_id: bill_id };
    } catch (error) {
        console.error(`Error saving bill ${bill_id}:`, error);
        throw error;
    }
};

// --- Get All Bills (History) ---
export const getAllBills = async () => {
    try {
        const db = await getDbConnection();
        const allRows = await db.getAllAsync(
            `SELECT * FROM bills ORDER BY date DESC;`
        );
        console.log("Fetched all bills successfully.");
        return allRows;
    } catch (error) {
        console.error("Error fetching all bills:", error);
        throw error;
    }
};

// --- Get Bill Header By ID ---
export const getBillById = async (bill_id) => {
    try {
        const db = await getDbConnection();
        const billHeader = await db.getFirstAsync(
            `SELECT * FROM bills WHERE bill_id = ?;`,
            [bill_id]
        );
        if (billHeader) {
            console.log(`Fetched bill header for id ${bill_id} successfully.`);
        } else {
            console.log(`No bill header found with id ${bill_id}.`);
        }
        return billHeader; // Returns the object or null/undefined if not found
    } catch (error) {
        console.error(`Error fetching bill header with id ${bill_id}:`, error);
        throw error;
    }
};


// --- Get Items for a Specific Bill ---
export const getBillItemsByBillId = async (bill_id) => {
     try {
        const db = await getDbConnection();
        const items = await db.getAllAsync(
            `SELECT * FROM bill_items WHERE bill_id_fk = ?;`,
            [bill_id]
        );
        console.log(`Fetched ${items.length} items for bill ${bill_id}.`);
        return items;
    } catch (error) {
        console.error(`Error fetching items for bill ${bill_id}:`, error);
        throw error;
    }
}
