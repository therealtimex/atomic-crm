import { createClient } from '@supabase/supabase-js';
import faker from 'faker';
import fs from 'fs';
import path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log('🚀 Starting Demo Seeding...');

    // 1. Clear existing data (Order matters for foreign keys)
    console.log('🧹 Clearing existing data...');
    await supabase.from('invoice_items').delete().neq('id', 0);
    await supabase.from('invoice_notes').delete().neq('id', 0);
    await supabase.from('invoices').delete().neq('id', 0);
    await supabase.from('task_activity').delete().neq('id', 0);
    await supabase.from('tasks').delete().neq('id', 0);
    await supabase.from('dealNotes').delete().neq('id', 0);
    await supabase.from('deals').delete().neq('id', 0);
    await supabase.from('contactNotes').delete().neq('id', 0);
    await supabase.from('contacts').delete().neq('id', 0);
    await supabase.from('companyNotes').delete().neq('id', 0);
    await supabase.from('companies').delete().neq('id', 0);
    await supabase.from('tags').delete().neq('id', 0);
    // Note: 'sales' might be linked to auth.users, so we handle it carefully

    // 2. Seed Tags
    console.log('🏷️  Seeding Tags...');
    const tags = [
        { name: 'VIP', color: '#ff0000' },
        { name: 'Promoter', color: '#00ff00' },
        { name: 'Reviewer', color: '#0000ff' },
        { name: 'Lead', color: '#ffa500' },
        { name: 'Customer', color: '#800080' }
    ];
    const { data: insertedTags } = await supabase.from('tags').insert(tags).select();

    // 3. Seed Sales People (Demo Users)
    console.log('👥 Seeding Sales People...');
    // We assume the user exists or we create a mapping
    // For demo, we might just use some random UUIDs if we don't care about real login for all of them
    // But for Jane Doe, we should ideally have a real user_id

    // Attempt to find janedoe if she exists in auth.users
    // For now, we'll just insert into public.sales manually for the demo
    // The user will need to sign up or we use a fixed UUID if the DB is fresh

    const demoSales = [
        {
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'janedoe@realtimex.ai',
            administrator: true,
            user_id: '00000000-0000-0000-0000-000000000000' // Mock UUID, update if needed
        }
    ];
    const { data: sales } = await supabase.from('sales').upsert(demoSales, { onConflict: 'email' }).select();
    const janeId = sales[0].id;

    // 4. Seed Companies
    console.log('🏢 Seeding Companies...');
    const sectors = ['tech', 'finance', 'healthcare', 'manufacturing', 'retail'];
    const companyData = Array.from({ length: 15 }).map(() => ({
        name: faker.company.companyName(),
        sector: faker.random.arrayElement(sectors),
        size: faker.random.number({ min: 10, max: 1000 }),
        website: faker.internet.url(),
        phone_number: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        zipcode: faker.address.zipCode(),
        sales_id: janeId,
        revenue: faker.random.arrayElement(['< 1M', '1M - 10M', '10M - 50M', '> 50M']),
        description: faker.company.catchPhrase()
    }));
    const { data: companies } = await supabase.from('companies').insert(companyData).select();

    // 5. Seed Contacts
    console.log('📇 Seeding Contacts...');
    const contactData = Array.from({ length: 50 }).map(() => {
        const company = faker.random.arrayElement(companies);
        return {
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            gender: faker.random.arrayElement(['male', 'female']),
            title: faker.name.jobTitle(),
            email: faker.internet.email(),
            phone_1_number: faker.phone.phoneNumber(),
            phone_1_type: 'mobile',
            company_id: company.id,
            sales_id: janeId,
            status: faker.random.arrayElement(['cold', 'warm', 'hot', 'customer']),
            background: faker.lorem.paragraph(),
            last_seen: faker.date.recent().toISOString(),
            first_seen: faker.date.past().toISOString(),
            tags: [faker.random.arrayElement(insertedTags).id]
        };
    });
    const { data: contacts } = await supabase.from('contacts').insert(contactData).select();

    // 6. Seed Deals
    console.log('💰 Seeding Deals...');
    const stages = ['opportunity', 'proposal_sent', 'in_negotiation', 'won', 'lost'];
    const dealData = Array.from({ length: 20 }).map(() => {
        const company = faker.random.arrayElement(companies);
        const dealContacts = faker.random.arrayElements(contacts.filter(c => c.company_id === company.id), faker.random.number({ min: 1, max: 2 }));
        return {
            name: `${company.name} - ${faker.commerce.productName()}`,
            company_id: company.id,
            contact_ids: dealContacts.map(c => c.id),
            stage: faker.random.arrayElement(stages),
            amount: faker.random.number({ min: 1000, max: 50000 }),
            sales_id: janeId,
            expected_closing_date: faker.date.future().toISOString(),
            description: faker.lorem.sentence()
        };
    });
    const { data: deals } = await supabase.from('deals').insert(dealData).select();

    // 7. Seed Tasks
    console.log('✅ Seeding Tasks...');
    const taskData = Array.from({ length: 30 }).map(() => {
        const contact = faker.random.arrayElement(contacts);
        const status = faker.random.arrayElement(['todo', 'in_progress', 'completed', 'waiting']);
        return {
            contact_id: contact.id,
            text: faker.lorem.sentence(),
            type: faker.random.arrayElement(['call', 'email', 'meeting', 'task']),
            due_date: faker.date.future().toISOString(),
            status: status,
            priority: faker.random.arrayElement(['low', 'medium', 'high']),
            sales_id: janeId,
            done_date: status === 'completed' ? faker.date.recent().toISOString() : null
        };
    });
    await supabase.from('tasks').insert(taskData);

    // 8. Seed Invoices
    console.log('📄 Seeding Invoices...');
    const invoiceData = Array.from({ length: 10 }).map((_, i) => {
        const company = faker.random.arrayElement(companies);
        const contact = faker.random.arrayElement(contacts.filter(c => c.company_id === company.id));
        return {
            invoice_number: `INV-2026-${String(i + 1).padStart(3, '0')}`,
            company_id: company.id,
            contact_id: contact?.id,
            status: faker.random.arrayElement(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
            issue_date: faker.date.recent().toISOString(),
            due_date: faker.date.future().toISOString(),
            currency: 'USD',
            subtotal: 0, // Will update after items
            tax_total: 0,
            total: 0,
            amount_paid: 0,
            sales_id: janeId
        };
    });
    const { data: insertedInvoices } = await supabase.from('invoices').insert(invoiceData).select();

    for (const inv of insertedInvoices) {
        const numItems = faker.random.number({ min: 1, max: 5 });
        const items = Array.from({ length: numItems }).map(() => {
            const qty = faker.random.number({ min: 1, max: 10 });
            const price = faker.random.number({ min: 50, max: 1000 });
            return {
                invoice_id: inv.id,
                description: faker.commerce.productName(),
                quantity: qty,
                unit_price: price,
                line_total: qty * price,
                line_total_with_tax: qty * price, // Simple for demo
                item_type: 'service'
            };
        });
        const { data: insertedItems } = await supabase.from('invoice_items').insert(items).select();

        const subtotal = insertedItems.reduce((acc, item) => acc + Number(item.line_total), 0);
        await supabase.from('invoices').update({
            subtotal,
            total: subtotal,
            amount_paid: inv.status === 'paid' ? subtotal : 0
        }).eq('id', inv.id);
    }

    // 9. Seed Business Profile
    console.log('🏢 Seeding Business Profile...');
    await supabase.from('business_profile').upsert({
        id: 1,
        name: 'RealTimeX Demo Corp',
        email: 'billing@realtimex.ai',
        website: 'https://realtimex.ai',
        address: '123 AI Avenue, San Francisco, CA',
        currency: 'USD',
        email_from_name: 'RealTimeX Billing',
        email_from_email: 'billing@realtimex.ai'
    });

    console.log('✨ Seeding Completed Successfully!');
}

seed().catch(err => {
    console.error('💥 Seeding Failed:', err);
    process.exit(1);
});
