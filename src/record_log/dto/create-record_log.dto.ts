/* eslint-disable prettier/prettier */
export class CreateRecordLogDto {
    menu_name: string;
    data_name: string;
    field: string;
    action: string;
    old_value?: string;
    new_value: string;
    // updated_by_email: string;
  }