import { createClient } from '@supabase/supabase-js';
import faker from 'faker';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CONTACTS_CSV_PATH = './demo/crm-demo-data-contacts.csv';

async function seed() {
    console.log('🚀 Starting Comprehensive Demo Seeding...');

    // 1. Clear existing data
    console.log('🧹 Clearing existing data...');
    await supabase.from('invoice_items').delete().neq('id', 0);
    await supabase.from('invoice_notes').delete().neq('id', 0);
    await supabase.from('invoices').delete().neq('id', 0);
    await supabase.from('task_activity').delete().neq('id', 0);
    await supabase.from('taskNotes').delete().neq('id', 0);
    await supabase.from('tasks').delete().neq('id', 0);
    await supabase.from('dealNotes').delete().neq('id', 0);
    await supabase.from('deals').delete().neq('id', 0);
    await supabase.from('contactNotes').delete().neq('id', 0);
    await supabase.from('contacts').delete().neq('id', 0);
    await supabase.from('companyNotes').delete().neq('id', 0);
    await supabase.from('companies').delete().neq('id', 0);
    await supabase.from('tags').delete().neq('id', 0);

    // 2. Read Contacts CSV
    console.log('📑 Reading Contacts CSV...');
    const csvData = fs.readFileSync(CONTACTS_CSV_PATH, 'utf8');
    const { data: rawContacts } = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`✅ Loaded ${rawContacts.length} contacts from CSV.`);

    // 3. Seed Tags
    console.log('🏷️  Seeding Tags...');
    const tagsList = [
        { name: 'VIP', color: '#ef4444' },
        { name: 'Q1 Lead', color: '#f59e0b' },
        { name: 'High Intent', color: '#10b981' },
        { name: 'Decision Maker', color: '#3b82f6' },
        { name: 'Competitor Switch', color: '#8b5cf6' },
        { name: 'Referral', color: '#ec4899' },
        { name: 'Customer', color: '#10b981' }
    ];
    const { data: insertedTags } = await supabase.from('tags').insert(tagsList).select();

    // 4. Seed Sales People
    console.log('👥 Ensuring Demo Admin User...');
    const demoEmail = 'janedoe@realtimex.ai';
    let { data: existingSales } = await supabase.from('sales').select('id, user_id').eq('email', demoEmail).single();

    let janeId;
    if (existingSales && existingSales.id === 3) {
        janeId = 3;
        console.log(`✅ Jane Doe already has correct ID: ${janeId}`);
    } else {
        console.log('✨ Ensuring Jane Doe has ID 3...');
        let authUserId = existingSales?.user_id;

        if (!authUserId) {
            const { data: { users } } = await supabase.auth.admin.listUsers();
            let authUser = users?.find(u => u.email === demoEmail);

            if (!authUser) {
                console.log('👤 Creating auth user...');
                const { data: { user }, error: createAuthError } = await supabase.auth.admin.createUser({
                    email: demoEmail,
                    password: 'password123',
                    email_confirm: true
                });
                if (createAuthError) {
                    console.error('❌ Error creating auth user:', createAuthError);
                    process.exit(1);
                }
                authUser = user;
            }
            authUserId = authUser.id;
        }

        // If she exists with a different ID, delete her first (related data is cleared anyway)
        if (existingSales && existingSales.id !== 3) {
            console.log(`🗑️ Deleting sales record with ID ${existingSales.id}...`);
            await supabase.from('sales').delete().eq('id', existingSales.id);
        }

        const { data: newSales, error: upsertError } = await supabase.from('sales').upsert({
            id: 3,
            first_name: 'Jane',
            last_name: 'Doe',
            email: demoEmail,
            administrator: true,
            user_id: authUserId
        }).select().single();

        if (upsertError) {
            console.error('❌ Error ensuring Jane Doe ID 3:', upsertError);
            process.exit(1);
        }
        janeId = newSales.id;
        console.log(`✅ Jane Doe forced to ID: ${janeId}`);
    }

    // 5. Seed Companies from CSV
    console.log('🏢 Seeding Companies from CSV...');
    const companyNames = [...new Set(rawContacts.map(c => c.company_name).filter(Boolean))];
    const sectors = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Energy'];
    const companyData = companyNames.map(name => ({
        name,
        sector: faker.random.arrayElement(sectors),
        size: faker.datatype.number({ min: 50, max: 5000 }),
        website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone_number: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        zipcode: faker.address.zipCode(),
        sales_id: janeId,
        revenue: faker.random.arrayElement(['1M - 10M', '10M - 50M', '50M - 100M', '> 100M']),
        description: `${name} is a leading provider of ${faker.commerce.department().toLowerCase()} solutions.`,
        logo: { src: `/logos/${faker.datatype.number({ min: 0, max: 55 })}.png` }
    }));
    const { data: companies, error: companiesError } = await supabase.from('companies').insert(companyData).select();
    const companyMap = Object.fromEntries(companies.map(c => [c.name, c.id]));

    // 6. Seed Contacts from CSV
    console.log('📇 Inserting Contacts...');
    const contactData = rawContacts.map(c => {
        const emails = [];
        if (c.email_work) emails.push({ email: c.email_work, type: 'Work' });
        if (c.email_home) emails.push({ email: c.email_home, type: 'Home' });
        if (c.email_other) emails.push({ email: c.email_other, type: 'Other' });
        if (emails.length === 0) emails.push({ email: faker.internet.email(c.first_name, c.last_name), type: 'Other' });

        const phones = [];
        if (c.phone_work) phones.push({ number: c.phone_work, type: 'Work' });
        if (c.phone_home) phones.push({ number: c.phone_home, type: 'Home' });
        if (c.phone_other) phones.push({ number: c.phone_other, type: 'Other' });
        if (phones.length === 0) phones.push({ number: faker.phone.phoneNumber(), type: 'Other' });

        // Ensure Jane Doe has hot contacts
        const isJaneTarget = Math.random() > 0.7;
        const targetStatus = isJaneTarget ? 'hot' : (c.status || faker.random.arrayElement(['cold', 'warm', 'hot', 'customer']));

        return {
            first_name: c.first_name,
            last_name: c.last_name,
            gender: c.gender || 'male',
            title: c.title || 'Manager',
            email_jsonb: emails,
            phone_jsonb: phones,
            company_id: companyMap[c.company_name] || null,
            sales_id: janeId,
            status: targetStatus,
            background: c.background || faker.lorem.paragraph(),
            last_seen: c.last_seen || new Date().toISOString(),
            first_seen: c.first_seen || faker.date.past().toISOString(),
            tags: [faker.random.arrayElement(insertedTags).id],
            linkedin_url: c.linkedin_url,
            has_newsletter: c.has_newsletter === 'true'
        };
    });
    const { data: contacts } = await supabase.from('contacts').insert(contactData).select();

    // 7. Seed Realistic Deals
    console.log('💰 Seeding 150 Realistic Deals...');
    const dealTemplates = [
        "Enterprise License Renewal", "Cloud Migration Consulting", "Security Audit & Hardening",
        "Premium Support Tier Upgrade", "Custom Implementation Phase 1", "Annual Platform Subscription",
        "Data Analytics Pro Bundle", "Onboarding & Training Package", "Dedicated Account Management",
        "API Integration Services"
    ];
    const stages = ['opportunity', 'proposal-sent', 'in-negociation', 'won', 'lost'];
    const dealData = Array.from({ length: 150 }).map((_, idx) => {
        const company = faker.random.arrayElement(companies);
        const dealContacts = contacts.filter(c => c.company_id === company.id);
        const selectedContacts = faker.random.arrayElements(dealContacts, Math.min(dealContacts.length, 2));

        // Distribute expected closing dates over next 6 months for better chart span
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + (idx % 6));
        futureDate.setDate(faker.datatype.number({ min: 1, max: 28 }));

        return {
            name: `${company.name} - ${faker.random.arrayElement(dealTemplates)}`,
            company_id: company.id,
            contact_ids: selectedContacts.map(c => c.id),
            stage: faker.random.arrayElement(stages),
            amount: faker.datatype.number({ min: 15000, max: 250000 }),
            sales_id: janeId,
            expected_closing_date: futureDate.toISOString(),
            description: faker.lorem.sentences(2)
        };
    });
    const { data: deals } = await supabase.from('deals').insert(dealData).select();

    // 8. Seed Realistic Tasks & Activity Logs
    console.log('✅ Seeding 200 Tasks with Activity Logs...');
    const taskTemplates = [
        { text: "Follow up on proposal", type: "call" },
        { text: "Send NDA for signature", type: "email" },
        { text: "Schedule technical deep-dive", type: "meeting" },
        { text: "Review contract redlines", type: "task" },
        { text: "Confirm billing details", type: "call" },
        { text: "Send onboarding documentation", type: "email" },
        { text: "Quarterly business review", type: "meeting" },
        { text: "Check-in on implementation", type: "call" }
    ];
    const taskStatuses = ['todo', 'in-progress', 'completed', 'waiting'];

    const allTaskData = Array.from({ length: 200 }).map((_, idx) => {
        const contact = faker.random.arrayElement(contacts);
        const template = faker.random.arrayElement(taskTemplates);

        // Ensure Jane has upcoming tasks
        const status = idx < 20 ? 'todo' : faker.random.arrayElement(taskStatuses);
        const dueDate = idx < 20
            ? faker.date.between(new Date(), faker.date.future(0.1)).toISOString()
            : faker.date.between(faker.date.past(), faker.date.future()).toISOString();

        return {
            contact_id: contact.id,
            text: template.text,
            type: template.type,
            due_date: dueDate,
            status: status,
            priority: faker.random.arrayElement(['low', 'medium', 'high']),
            sales_id: janeId,
            done_date: status === 'completed' ? faker.date.recent().toISOString() : null
        };
    });
    const { data: insertedTasks } = await supabase.from('tasks').insert(allTaskData).select();

    // Generate Activity Logs
    const activities = [];
    for (const task of insertedTasks) {
        activities.push({
            task_id: task.id,
            sales_id: janeId,
            action: 'created',
            created_at: faker.date.past(0.1, task.created_at).toISOString()
        });

        if (task.status !== 'todo') {
            activities.push({
                task_id: task.id,
                sales_id: janeId,
                action: 'updated',
                details: { status: 'in-progress' },
                created_at: faker.date.recent().toISOString()
            });
        }

        if (task.status === 'completed') {
            activities.push({
                task_id: task.id,
                sales_id: janeId,
                action: 'completed',
                created_at: task.done_date
            });
        }
    }
    await supabase.from('task_activity').insert(activities);

    // 9. Seed Realistic Invoices
    console.log('📄 Seeding 50 Detailed Invoices...');
    const invoiceItemTemplates = [
        "Advanced Analytics Add-on", "Monthly Platform Fee", "Professional Services (Hourly)",
        "Data Storage Overages", "API Access Pack (1M requests)", "Custom Security Integration",
        "Enterprise Support Plan", "User Seat License (x10)"
    ];

    const invoiceData = Array.from({ length: 50 }).map((_, i) => {
        const company = faker.random.arrayElement(companies);
        const contact = faker.random.arrayElement(contacts.filter(c => c.company_id === company.id));
        const statusList = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        const status = faker.random.arrayElement(statusList);

        // Revenue span from July 2025 to Jan 2026
        const issueDate = new Date('2025-07-01');
        issueDate.setMonth(issueDate.getMonth() + (i % 7));
        issueDate.setDate(faker.datatype.number({ min: 1, max: 28 }));

        return {
            invoice_number: `INV-2026-${String(i + 1).padStart(3, '0')}`,
            company_id: company.id,
            contact_id: contact?.id,
            status: status,
            issue_date: issueDate.toISOString(),
            due_date: faker.date.future().toISOString(),
            currency: 'USD',
            subtotal: 0,
            tax_total: 0,
            total: 0,
            amount_paid: 0,
            sales_id: janeId
        };
    });
    const { data: insertedInvoices } = await supabase.from('invoices').insert(invoiceData).select();

    for (const inv of insertedInvoices) {
        const numItems = faker.datatype.number({ min: 1, max: 4 });
        const items = Array.from({ length: numItems }).map(() => {
            const qty = faker.datatype.number({ min: 1, max: 5 });
            const price = faker.random.arrayElement([499, 999, 1499, 2500, 5000]);
            return {
                invoice_id: inv.id,
                description: faker.random.arrayElement(invoiceItemTemplates),
                quantity: qty,
                unit_price: price,
                line_total: qty * price,
                line_total_with_tax: qty * price,
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

    // 10. Final Touch: Add some Notes to random entities
    console.log('📝 Adding 100 random notes...');
    const contactNotes = Array.from({ length: 50 }).map(() => ({
        contact_id: faker.random.arrayElement(contacts).id,
        sales_id: janeId,
        text: faker.lorem.sentences(2),
        date: faker.date.recent().toISOString()
    }));
    await supabase.from('contactNotes').insert(contactNotes);

    const dealNotes = Array.from({ length: 50 }).map(() => ({
        deal_id: faker.random.arrayElement(deals).id,
        sales_id: janeId,
        text: faker.lorem.sentences(2),
        date: faker.date.recent().toISOString()
    }));
    await supabase.from('dealNotes').insert(dealNotes);

    // 11. Update Business Profile
    console.log('🏢 Updating Business Profile...');
    await supabase.from('business_profile').upsert({
        id: 1,
        name: 'RealTimeX Demo',
        email: 'janedoe@realtimex.ai',
        website: 'https://demo.realtimex.ai',
        address: '123 AI Boulevard, Silicon Valley, CA',
        currency: 'USD',
        email_from_name: 'Jane Doe @ RealTimeX',
        email_from_email: 'janedoe@realtimex.ai'
    });

    console.log('✨ GTM Demo Seeding Completed Successfully! 🚀');
}

seed().catch(err => {
    console.error('💥 Seeding Failed:', err);
    process.exit(1);
});
