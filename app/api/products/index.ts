import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req : NextApiRequest, res : NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const products = await prisma.product.findMany();
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error : 'Internal Server Error'});
        }
    } else {
        res.status(405).end();
    }
}