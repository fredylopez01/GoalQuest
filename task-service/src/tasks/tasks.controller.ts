import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ClientIp } from 'src/common/decorators/client-ip.decorator';
import { FilterTasksDto } from './dto/filter-task.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { TaskDetailResponseDto } from './dto/task-detail-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una tarea asociada a una meta' })
  @ApiResponse({
    status: 201,
    description: 'Tarea creada exitosamente',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'La meta no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  async createTask(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTaskDto,
    @ClientIp() ipAddress: string | null,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(userId, dto, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de tareas',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() filters: FilterTasksDto,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.tasksService.findAllByUser(userId, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una tarea con historial de completaciones',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la tarea con completaciones',
    type: TaskDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TaskDetailResponseDto> {
    return this.tasksService.findOneByUser(id, userId);
  }
}
