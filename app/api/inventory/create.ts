import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

const createInventorySchema = z.object({
    productId: z.string().min(1, { message : 'Product ID is required'}),
    quantity: z.number().min(0, { message : 'Quantity must be positive'}),
});

export default async function handler ( req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST') {
        try {
            const parsedData = createInventorySchema.parse(req.body);

            const inventory = await prisma.inventory.create({
                data: parsedData,
            });
            res.status(201).json(inventory);
        } catch(error) {
            if(error instanceof z.ZodError) {
                res.status(400).json({error : error.issues});
            } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if(error.code === 'P2003') {
                    res.status(409).json({error : 'Product not found'});
                } else {
                    res.status(500).json({error : 'Internal Server Error'});
                }
            } else {
                console.error(error);
                res.status(500).json({error : 'Internal Server Error'});
            }
        }
    } else {
        res.status(405).end();
    }
}