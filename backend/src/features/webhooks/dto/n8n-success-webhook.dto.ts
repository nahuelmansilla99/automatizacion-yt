import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class N8nSuccessWebhookDto {
  @IsNotEmpty({ message: 'El ID del resumen es requerido' })
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  id: string;

  // Tolerante a videoTitle o title
  @IsOptional()
  @IsString()
  videoTitle?: string;

  @IsOptional()
  @IsString()
  title?: string;

  // Tolerante a channelName o channel
  @IsOptional()
  @IsString()
  channelName?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  // Tolerante a markdownContent, markdown o text
  @IsOptional()
  @IsString()
  markdownContent?: string;

  @IsOptional()
  @IsString()
  markdown?: string;

  @IsOptional()
  @IsString()
  text?: string;
}
