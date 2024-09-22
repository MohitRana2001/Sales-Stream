import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

const updateProductSchema = z.object({
    name : z.string().min(1, { message : 'Name is required'}).optional(),
    description : z.string().optional(),
    price : z.number().min(0, { message : 'Price must be positive'}).optional(),
    category : z.string().min(1, { message : 'Category is required'}).optional(),
    qrCode : z.string().min(1, { message : 'QR code is required'}).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    const productId = req.query.id as string; 

    switch(req.method) {
        case 'GET' :
            try {
                const product = await prisma.product.findUnique({
                    where : { id : productId }
                });
                if(!product) {
                    return res.status(404).json({error : 'Product not found'});
                }
                res.status(200).json(product);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error : 'Internal Server Error'});
            }
            break;
        case 'PUT' :
        case 'PATCH' :
            try {
                const parsedData = updateProductSchema.parse(req.body);

                const product = await prisma.product.update({
                    where : { id : productId},
                    data : parsedData,
                });

                res.status(200).json(product);
            } catch(error) {
                if(error instanceof z.ZodError) {
                    res.status(400).json({error : error.issues});
                } else if ( error instanceof Prisma.PrismaClientKnowRequestError) {
                    if(error.code === 'P2002') {
                        res.status(409).json({error : 'QR code already exists'});
                    } else if (error.code === ' P2025'){
                        res.status(404).json({error : 'Product not found'});
                    } else {
                        res.status(500).json({error : 'Internal Server Error'});
                    }
                } else {
                    console.error(error);
                    res.status(500).json({error : 'Internal Server Error'});
                }
            }
            break;
            
        case 'DELETE' :
            try {
                await prisma.product.delete({
                    where : { id : productId},
                });

                res.status(204).end();
            } catch ( error ) {
                if(error instanceof Prisma.PrismaClientKnowRequestError) {
                    if(error.code === 'P2025') {
                        res.status(404).json({error : 'Product not found'});
                    } else {
                        res.status(500).json({error : 'Internal Server Error'});
                    }
                } else{
                    console.error(error);
                    res.status(500).json({error : 'Internal Server Error'});
                }
            }
            break;

        default :
            res.status(405).end();
    }
}