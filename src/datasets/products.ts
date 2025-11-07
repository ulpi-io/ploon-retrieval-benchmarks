/**
 * Products Dataset Generator
 * E-commerce product catalog with colors and sizes
 */

import { faker } from '@faker-js/faker'
import type { Product } from '../types'

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Sports',
  'Home & Garden',
  'Toys',
  'Food & Beverage',
]

const PRODUCT_TAGS = [
  'bestseller',
  'new-arrival',
  'on-sale',
  'limited-edition',
  'eco-friendly',
  'premium',
  'clearance',
]

const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Pink', hex: '#FFC0CB' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function generateProducts(count: number): Product[] {
  const products: Product[] = []

  for (let i = 0; i < count; i++) {
    const basePrice = Number(faker.commerce.price({ min: 10, max: 500 }))

    const tagCount = faker.number.int({ min: 1, max: 3 })
    const tags: string[] = faker.helpers.arrayElements(PRODUCT_TAGS, tagCount)

    const createdAt = faker.date.recent({ days: 365 }).toISOString()
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() }).toISOString()

    // Generate colors (2-4 colors per product)
    const colorCount = faker.number.int({ min: 2, max: 4 })
    const selectedColors = faker.helpers.arrayElements(COLORS, colorCount)

    const colors = selectedColors.map(color => {
      // Each color has 3-6 sizes
      const sizeCount = faker.number.int({ min: 3, max: 6 })
      const availableSizes = faker.helpers.arrayElements(SIZES, sizeCount)

      const sizes = availableSizes.map(size => {
        // Price varies slightly per size (+$0-20)
        const priceVariation = faker.number.float({ min: 0, max: 20 })
        const price = Number((basePrice + priceVariation).toFixed(2))

        return {
          size,
          sku: `SKU-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
          inStock: faker.number.int({ min: 0, max: 100 }),
          price,
        }
      })

      return {
        name: color.name,
        hex: color.hex,
        sizes,
      }
    })

    products.push({
      id: `P${String(i + 1).padStart(5, '0')}`,
      name: faker.commerce.productName(),
      category: CATEGORIES[i % CATEGORIES.length]!,
      basePrice,
      rating: Number(faker.number.float({ min: 1, max: 5, fractionDigits: 1 })),
      reviewCount: faker.number.int({ min: 0, max: 500 }),
      tags,
      colors,
      dimensions: {
        width: Number(faker.number.float({ min: 5, max: 100, fractionDigits: 1 })),
        height: Number(faker.number.float({ min: 5, max: 100, fractionDigits: 1 })),
        depth: Number(faker.number.float({ min: 5, max: 100, fractionDigits: 1 })),
        weight: Number(faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 })),
      },
      createdAt,
      updatedAt,
    })
  }

  return products
}
