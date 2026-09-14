import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreatePromptDto {
  @IsNotEmpty({ message: 'El nombre del prompt es obligatorio' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty({ message: 'El contenido del prompt es obligatorio' })
  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
