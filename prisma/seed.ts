import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Seed data for Product
    const products = [
        {
            id: 'product1',
            name: 'Product 1',
            description: 'Description for product 1',
            price: 10.99,
            category: 'Category 1',
            qrCode: 'qrcode1',
            stock: 100,
        },
        {
            id: 'product2',
            name: 'Product 2',
            description: 'Description for product 2',
            price: 20.99,
            category: 'Category 2',
            qrCode: 'qrcode2',
            stock: 200,
        },
    ];

    // Seed data for Inventory
    const inventories = [
        {
            id: 'inventory1',
            productId: 'product1',
            quantity: 50,
        },
        {
            id: 'inventory2',
            productId: 'product2',
            quantity: 150,
        },
    ];

    // Seed data for Invoice
    const invoices = [
        {
            id: 'invoice1',
            createdAt: new Date(),
            total: 100.00,
        },
        {
            id: 'invoice2',
            createdAt: new Date(),
            total: 200.00,
        },
    ];

    // Insert Product data
    for (const product of products) {
        await prisma.product.create({
            data: product,
        });
    }

    // Insert Inventory data
    for (const inventory of inventories) {
        await prisma.inventory.create({
            data: inventory,
        });
    }

    // Insert Invoice data
    for (const invoice of invoices) {
        await prisma.invoice.create({
            data: invoice,
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });