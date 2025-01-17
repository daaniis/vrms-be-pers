/* eslint-disable prettier/prettier */
import { freelanceData } from "./freelance";
import { vendorData } from "./vendor";
import { templateData } from "./template";
import { Role } from "@prisma/client";
import { userData } from "./user";

const vendorUsername = vendorData[0].username;
const freelanceUsername = freelanceData[13].username;
const templateName1 = templateData[0].template_name;
const emailaksesRM = userData[4].email;
const emailaksesMDRT = userData[3].email;

export const recordData= [
    {
        menu_name: 'Resource Manager - Vendor',
        data_name: vendorUsername,
        field: 'email',
        action: 'Update',
        old_value: 'old@example.com',
        new_value: 'bkilius0@scribd.com',
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-05-01T00:00:00.000Z',
        updated_at: '2024-05-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Vendor',
        data_name: vendorUsername,
        field: 'full_address',
        action: 'Update',
        old_value: 'Jalan Melati',
        new_value: '99 Starling Center',
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-05-01T00:00:00.000Z',
        updated_at: '2024-05-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Vendor',
        data_name: vendorUsername,
        field: 'template_name',
        action: 'Update',
        old_value: 'Daaniis Raditya',
        new_value: "Garovagl''s Rim Lichen",
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-05-01T00:00:00.000Z',
        updated_at: '2024-05-01T00:00:00.000Z',
    },
    {
        menu_name: 'Master Data - Variable Input Form - Translation',
        data_name: '1',
        field: 'pic_name',
        action: 'Create',
        old_value: null,
        new_value: templateName1,
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-03-01T00:00:00.000Z',
        updated_at: '2024-05-01T00:00:00.000Z',
    },
    {
        menu_name: 'System Administrator',
        data_name: '1',
        field: 'full_name',
        action: 'Create',
        old_value: null,
        new_value: "Randi Hembery",
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-02-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'System Administrator',
        data_name: '1',
        field: 'email',
        action: 'Create',
        old_value: null,
        new_value: "rhembery5@gmail.com",
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-02-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'System Administrator',
        data_name: '1',
        field: 'role',
        action: 'Create',
        old_value: null,
        new_value: Role.Admin,
        updated_by_email: 'daaniis@gmail.com',
        created_at: '2024-02-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: 'full_name',
        action: 'Update',
        old_value: 'Siti Nurbaya',
        new_value: 'Rowe Campelli',
        updated_by_email: emailaksesRM,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: 'postal_code',
        action: 'Update',
        old_value: '00000',
        new_value: '12345',
        updated_by_email: emailaksesRM,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: 'nickname',
        action: 'Update',
        old_value: 'sitin',
        new_value: 'Siberian Larkspur',
        updated_by_email: emailaksesRM,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: 'specialization_on',
        action: 'Update',
        old_value: 'Developer',
        new_value: 'Human Resources Manager',
        updated_by_email: emailaksesRM,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: 'branch_office',
        action: 'Update',
        old_value: 'Surakarta',
        new_value: 'Jakarta',
        updated_by_email: emailaksesRM,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Master Data - Rate Type',
        data_name: '1',
        field: 'rate_type_name',
        action: 'Update',
        old_value: 'Translator',
        new_value: 'Translation',
        updated_by_email: emailaksesMDRT,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Master Data - Rate Type',
        data_name: '2',
        field: 'rate_type_name',
        action: 'Update',
        old_value: 'Editor',
        new_value: 'Editing',
        updated_by_email: emailaksesMDRT,
        created_at: '2024-04-01T00:00:00.000Z',
        updated_at: '2024-04-01T00:00:00.000Z',
    },
    {
        menu_name: 'Resource Manager - Freelance',
        data_name: freelanceUsername,
        field: null,
        action: 'Delete',
        old_value: null,
        new_value: null,
        updated_by_email: emailaksesRM,
        created_at: '2024-05-01T00:00:00.000Z',
        updated_at: '2024-05-01T00:00:00.000Z',
    },
];