import { ApiProperty } from '@nestjs/swagger';
import { TypeResource } from '@prisma/client';

export class UploadAttachmentVendorDto {
  @ApiProperty()
  type_resource: TypeResource;
}
