import { ConflictException, NotFoundException } from '@nestjs/common';

export const ERROR_MESSAGES = {
  RESOURCE_EXISTS: (resource: string, field: string, value: string) =>
    `${resource} with ${field} "${value}" already exists`,
  RESOURCE_NOT_FOUND: (resource: string) => `${resource} not found`,
};

// Excepción genérica para recurso existente
export class ResourceExistsException extends ConflictException {
  constructor(resource: string, field: string, value: string) {
    super(ERROR_MESSAGES.RESOURCE_EXISTS(resource, field, value));
  }
}

// Excepción genérica para recurso no encontrado
export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string) {
    super(ERROR_MESSAGES.RESOURCE_NOT_FOUND(resource));
  }
}
