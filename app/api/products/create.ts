import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

const productSchema = z.object({
    name : z.string().min(1, {message : 'Name is required'}),
    description : z.string().optional(),
    price : z.number().positive({message : 'Price must be positive'}),
    category : z.string().min(1, {message : 'Category is required'}),
    image : z.string().optional(),
    qrCode : z.string().min(1, { message : 'QR code is required'}),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'POST') {
        try {
            const parsedData = productSchema.parse(req.body);

            const product = await prisma.product.create({
                data: parsedData,
            });
            res.status(201).json(product);
        } catch(error) {
            if ( error instanceof z.ZodError) {
                res.status(400).json({error : error.issues});
            } else if ( error instanceof Prisma.PrismaClientKnowRequestError) {
                if(error.code === 'P2002') {
                    res.status(409).json({error : 'QR code already exists'});
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