import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class N8nErrorWebhookDto {
  @IsNotEmpty({ message: 'El ID del resumen es requerido' })
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  id: string;

  // Tolerante a errorMessage o message
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  failedNode?: string;
}
