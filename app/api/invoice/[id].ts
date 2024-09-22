import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from 'zod';

const prisma = new PrismaClient();

const updateInvoiceSchema = z.object({
    customerId: z.string().min(1, { message : 'Customer ID is required'}),
    items: z.array(z.object({
        productId: z.string().min(1, { message : 'Product ID is required'}),
        quantity: z.number().min(1, { message : 'Quantity must be positive'}),
    })),
});

export default async function handler ( req : NextApiRequest , res: NextApiResponse) {
    const invoiceId = req.query.id as string;

    switch ( req.method ) {
        case 'GET' :
            try {
                const invoice = await prisma.invoice.findUnique({
                    where : { id : invoiceId},
                    include : { items : true},
                });
                if(!invoice) {
                    return res.status(404).json({error : 'Invoice not found'});
                }
                res.status(200).json(invoice);
            } catch (error) {
                console.error(error);
                res.status(500).json({error : 'Internal Server Error'});
            }
            break;

        case 'PUT' :
        case 'PATCH' :
            try {
                const parsedData = updateInvoiceSchema.parse(req.body);

                let total = 0;
                for(const item of parsedData.items) {
                    const product = await prisma.product.findUnique({
                        where : { id : item.productId},
                    });

                    if(!product) {
                        return res.status(404).json({error : `Product with ID ${item.productId} not found`});
                    }

                    total += product.price * item.quantity;

                    await prisma.inventory.update({
                        where : { productId : item.productId},
                        data : { quantity : { decrement : item.quantity}},
                    });
                }

                const invoice = await prisma.invoice.update({
                    where : { id : invoiceId},
                    data : {
                        total,
                    }
                });

                res.status(200).json(invoice);
            } catch (error) {
                if(error instanceof z.ZodError) {
                    res.status(400).json({error : error.issues});
                } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if(error.code === 'P2002') {
                        res.status(409).json({error : 'Product not found'});
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
                await prisma.invoice.delete({
                    where : { id : invoiceId},
                });

                res.status(204).end();
            } catch (error) {
                if(error instanceof Prisma.PrismaClientKnownRequestError) {
                    if(error.code === 'P2025') {
                        res.status(404).json({error : 'Invoice not found'});
                    } else {
                        res.status(500).json({error : 'Internal Server Error'});
                    }
                } else {
                    console.error(error);
                    res.status(500).json({error : 'Internal Server Error'});
                }
            }

            break;

        default :
            res.status(405).end();
    }
}