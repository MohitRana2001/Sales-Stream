import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateInventorySchema = z.object({
  quantity: z.number().min(0, { message: 'Quantity must be non-negative' }).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const inventoryItemId = req.query.id as string;

  switch (req.method) {
    case 'GET':
      try {
        const inventoryItem = await prisma.inventory.findUnique({
          where: { id: inventoryItemId },
        });

        if (!inventoryItem) {
          return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.status(200).json(inventoryItem);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
      break;

    case 'PUT':
    case 'PATCH':
      try {
        const parsedData = updateInventorySchema.parse(req.body);

        const inventoryItem = await prisma.inventory.update({
          where: { id: inventoryItemId },
          data: parsedData,
        });

        res.status(200).json(inventoryItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ error: error.issues });
        } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            res.status(404).json({ error: 'Inventory item not found' });
          } else {
            res.status(500).json({ error: 'Internal Server Error' });
          }
        } else {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      break;

    case 'DELETE':
      try {
        await prisma.inventory.delete({
          where: { id: inventoryItemId },
        });

        res.status(204).end();
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            res.status(404).json({ error: 'Inventory item not found' });
          } else {
            res.status(500).json({ error: 'Internal Server Error' });
          }
        } else {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      break;

    default:
      res.status(405).end(); // Method Not Allowed
  }
}