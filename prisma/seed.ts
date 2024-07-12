/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import { templateData } from './data/template';
import { variableData } from './data/variable';
import { countryData } from './data/country';
import { stateData } from './data/state';
import { cityData } from './data/city';
import { languageData } from './data/language';
import { currencyData } from './data/currency';
import { menuData } from './data/menu';
import { rateTypeData } from './data/rate-type';
import { toolData } from './data/tool';
import { userData } from './data/user';
import { freelanceData } from './data/freelance';
import { vendorData } from './data/vendor';
import { recordData } from './data/record-log';
import { submitRatingData } from './data/submit-rating';
import { pmNoteData } from './data/pm-note';

const prisma = new PrismaClient();
async function main() {
  const country = await prisma.country.createMany({
    data: countryData,
  });
  const state = await prisma.state.createMany({
    data: stateData,
  });
  const city = await prisma.city.createMany({
    data: cityData,
  });
  const language = await prisma.language.createMany({
    data: languageData,
  });
  const currency = await prisma.currency.createMany({
    data: currencyData,
  });
  for (const data of menuData) {
    await prisma.menu.create({
      data: { ...data },
    });
  }  

  for (const data of variableData) {
    await prisma.variable.create({
      data: { ...data },
    });
  }
  for (const data of rateTypeData) {
    await prisma.rateType.create({
      data: { ...data },
    });
  }
  for (const data of templateData) {
    await prisma.template.create({
      data: { ...data },
    });
  }
  for (const data of toolData) {
    await prisma.tool.create({
      data: { ...data },
    });
  }
  const user = userData;
  for (const data of freelanceData) {
    await prisma.freelance.create({
      data: { ...data },
    });
  }
  for (const data of vendorData) {
    await prisma.vendor.create({
      data: { ...data },
    });
  }
  for (const data of submitRatingData) {
    const freelance = await prisma.freelance.findUnique({
      where: { username: data.username },
      select: { freelance_id: true },
    });

    const vendor = await prisma.vendor.findUnique({
      where: { username: data.username },
      select: { vendor_id: true },
    });

    if (freelance) {
      await prisma.submitRating.create({
        data: {
          type_resource: data.type_resource,
          project_name: data.project_name,
          files: data.files,
          rating: data.rating,
          review: data.review,
          user_id: data.user_id,
          freelance_id: freelance.freelance_id,
        },
      });
    } else if (vendor) {
      await prisma.submitRating.create({
        data: {
          type_resource: data.type_resource,
          project_name: data.project_name,
          files: data.files,
          rating: data.rating,
          review: data.review,
          user_id: data.user_id,
          vendor_id: vendor.vendor_id,
        },
      });
    } else {
      console.error(`${data.username} not found.`);
    }
  }
  for (const data of pmNoteData) {
    const freelance = await prisma.freelance.findUnique({
      where: { username: data.username },
      select: { freelance_id: true },
    });

    const vendor = await prisma.vendor.findUnique({
      where: { username: data.username },
      select: { vendor_id: true },
    });

    if (freelance) {
      await prisma.pMNotes.create({
        data: {
          type_resource: data.type_resource,
          freelance_id: freelance.freelance_id,
          note: data.note,
          user_note_id: data.user_note_id,
          status_approval: data.status_approval,
          reply: data.reply,
          user_reply_id: data.user_reply_id,
        },
      });
    } else if (vendor) {
      await prisma.pMNotes.create({
        data: {
          type_resource: data.type_resource,
          vendor_id: vendor.vendor_id,
          note: data.note,
          user_note_id: data.user_note_id,
          status_approval: data.status_approval,
          reply: data.reply,
          user_reply_id: data.user_reply_id,
        },
      });
    } else {
      console.error(`${data.username} not found.`);
    }
  }
  for (const data of recordData) {
    await prisma.recordLog.create({
      data: {
        menu_name: data.menu_name,
        data_name: data.data_name,
        field: data.field,
        action: data.action,
        old_value: data.old_value,
        new_value: data.new_value,
        updated_by_email: data.updated_by_email,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    });
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
