"use server";
 // 标记所有导出的函数作为服务函数

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(["pending", "paid"]),
    date: z.string()
});

// CreateInvoice is a form schema that omits the id and date fields
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status")
    })
    const amountInCents = amount * 100;

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
    `;
    // 一旦数据插入，发票面板数据就会及时更新，这种方式可以减少请求数量
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function createInvoice(formData: FormData) {
    console.log("Creating invoice...");
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status")
    })

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    await sql`
        insert into invoices (customer_id, amount, status, date)
        values (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    // 一旦数据插入，发票面板数据就会及时更新，这种方式可以减少请求数量
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

