import prisma from '../config/prisma.js';

export async function generateCode(prefix: string): Promise<string> {
  if (!prefix) {
    throw new Error('Prefix is required for auto-numbering');
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.autoNumberCounter.findUnique({
      where: { prefix },
    });

    let nextNumber = 1;
    if (existing) {
      nextNumber = existing.currentNumber + 1;
      await tx.autoNumberCounter.update({
        where: { prefix },
        data: { currentNumber: nextNumber },
      });
    } else {
      await tx.autoNumberCounter.create({
        data: { prefix, currentNumber: 1 },
      });
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  });

  return result;
}
