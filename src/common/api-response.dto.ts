import { Expose, Type } from 'class-transformer';

export function ApiResponseDTO<T>(dtoClass: new () => T) {
  class ApiResponseClass {
    @Expose()
    success: boolean;

    @Expose()
    message: string;

    @Expose()
    @Type(() => dtoClass) // ← Now it knows the class!
    createdItem?: T;

    @Expose()
    @Type(() => dtoClass)
    item?: T;

    @Expose()
    @Type(() => dtoClass)
    items?: T[];
  }

  return ApiResponseClass;
}
