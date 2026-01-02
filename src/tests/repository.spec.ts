import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductRepository } from '../db/repository.js';
import { Product } from '../models/schema.js';

describe('ProductRepository', () => {
  let repo: ProductRepository;

  beforeEach(async () => {
    repo = new ProductRepository();
    await repo.init(':memory:');
  });

  afterEach(async () => {
    await repo.close();
  });

  const mockProduct: Product = {
    name: 'Test Product',
    version: '1.0.0',
    status: 'Discovery',
    vision: {
      summary: 'A test product vision',
      goals: ['Goal 1', 'Goal 2'],
    },
    personas: [
      { name: 'User A', description: 'Desc A' }
    ],
    requirements: {
      functional: [
        { id: 'REQ-001', title: 'Feature 1', description: 'Desc 1', priority: 'P0' }
      ],
      non_functional: [],
      ui_ux: []
    },
    technical_constraints: [],
    success_metrics: []
  };

  it('should save and retrieve a product', async () => {
    const id = await repo.saveProduct(mockProduct);
    const retrieved = await repo.getProduct(id);
    expect(retrieved).toEqual(mockProduct);
  });

  it('should update a product', async () => {
    const id = await repo.saveProduct(mockProduct);
    const updatedProduct = { ...mockProduct, name: 'Updated Name' };
    await repo.updateProduct(id, updatedProduct);
    const retrieved = await repo.getProduct(id);
    expect(retrieved?.name).toBe('Updated Name');
  });

  it('should throw error for invalid product', async () => {
    const invalidProduct = { ...mockProduct, status: 'Invalid' } as any;
    await expect(repo.saveProduct(invalidProduct)).rejects.toThrow();
  });
});

