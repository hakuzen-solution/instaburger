import { z } from "zod"

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome do produto é obrigatório"),
  description: z.string().trim().nullish(),
  price: z.number().int("Preço deve ser um número inteiro").nonnegative("Preço não pode ser negativo"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  active: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome da categoria é obrigatório"),
  active: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

const orderItemSchema = z.object({
  productId: z.string().min(1, "Item do pedido sem produto"),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero").optional(),
})

export const orderWriteSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Adicione itens ao pedido"),
  notes: z.string().nullish(),
})

export function firstValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos"
}
