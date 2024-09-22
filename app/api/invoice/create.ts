import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from Zod;

const prisma = new PrismaClient();

const invoiceItemSchema = z.object({
    productId: z.string().min(1, { message: 'Product ID is required'}),
    quantity: z.number().min(0, { message: 'Quantity must be at least 1'}),
});

const createInvoiceSchema = z.object({
    customerId: z.string().min(1, { message : 'Customer ID is required'}),
    items: z.array(invoiceItemSchema),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST'){
        try {
            const parsedData = createInvoiceSchema.parse(req.body);

            let total = 0;
            for(const item of parsedData.items) {
                const product = await prisma.product.findUnique({
                    where : { id : item.productId},
                });

                if(!product) {
                    return res.status(404).json ({error : `Product with ID ${item.productId} not found`});
                }

                total += product.price * item.quantity;

                await prisma.inventory.update({
                    where : { productId : item.productId},
                    data : { quantity: { decrement: item.quantity}},
                });
            }

            const invoice = await prisma.invoice.create({
                data : {
                    total,
                }
            })

            res.status(201).json({invoice});

        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ error : error.issues});
            }else {
                console.error(error);
                res.status(500).json({error : 'Internal Server Error'});
            }
        }
    } else {
        res.status(405).end();
    }
}
