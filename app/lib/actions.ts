'use server';

import {z} from 'zod'
import {sql} from '@vercel/postgres'
import {revalidatePath} from "next/cache";
import {redirect} from 'next/navigation'

const InvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string()
});

const CreateInvoice = InvoiceSchema.omit({id: true, date: true})
const UpdateInvoice = InvoiceSchema.omit({date: true, id:true})

export const createInvoices = async (formData: FormData) => {
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    })
    const amountInCent = amount * 100;
    const date = new Date().toISOString().split('T')[0]
    
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCent}, ${status}, ${date})
    `;
    
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export const updateInvoice = async (id: string, formData: FormData)=> {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        status: formData.get('status'),
        amount: formData.get('amount')
    })
    const amountInCents = amount * 100
    
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id=${id}
    `;
    
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export const deleteInvoice = async (id:string) => {
    await sql`
    DELETE FROM invoices WHERE id = ${id}
    `;
    revalidatePath('/dashboard/invoices')
}