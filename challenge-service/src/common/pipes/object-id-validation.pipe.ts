import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: `"${value}" is not a valid ObjectId`,
      });
    }
    return value;
  }
}
