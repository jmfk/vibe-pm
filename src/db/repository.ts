import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Product, ProductSchema } from '../models/schema.js';

export class ProductRepository {
  private db: Database | null = null;

  async init(dbPath: string = ':memory:') {
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL
      )
    `);
  }

  async saveProduct(product: Product): Promise<number> {
    if (!this.db) throw new Error('DB not initialized');
    
    // Validate before saving
    ProductSchema.parse(product);
    
    const result = await this.db.run(
      'INSERT INTO products (data) VALUES (?)',
      JSON.stringify(product)
    );
    
    return result.lastID!;
  }

  async getProduct(id: number): Promise<Product | null> {
    if (!this.db) throw new Error('DB not initialized');
    
    const row = await this.db.get('SELECT data FROM products WHERE id = ?', id);
    if (!row) return null;
    
    return JSON.parse(row.data);
  }

  async updateProduct(id: number, product: Product): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    
    ProductSchema.parse(product);
    
    await this.db.run(
      'UPDATE products SET data = ? WHERE id = ?',
      JSON.stringify(product),
      id
    );
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

