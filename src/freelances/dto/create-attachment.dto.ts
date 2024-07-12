import { ApiProperty } from '@nestjs/swagger';
import { TypeResource } from '@prisma/client';

export class UploadAttachmentDto {
  @ApiProperty()
  type_resource: TypeResource;
}
