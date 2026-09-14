import {
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateSummaryDto {
  @IsNotEmpty({ message: 'La URL de YouTube es obligatoria' })
  @IsString({ message: 'La URL debe ser una cadena de texto' })
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/,
    {
      message:
        'Debe ser un enlace válido de YouTube (ej. https://www.youtube.com/watch?v=... o https://youtu.be/...)',
    },
  )
  youtubeUrl: string;

  @IsOptional()
  @IsUUID('4', { message: 'El promptId debe ser un UUID v4 válido' })
  promptId?: string;
}
