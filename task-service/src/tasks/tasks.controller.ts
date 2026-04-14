import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateTaskDto } from './dto/update-task.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';
import { CompleteTaskResponseDto } from './dto/complete-task-response.dto';
import { DailySummaryDto } from './dto/daily-summary.dto';
import { CompletionHistoryDto } from './dto/completion-history.dto';
import { FilterCompletionsDto } from './dto/filter-completions.dto';

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

  @Get('daily-summary')
  @ApiOperation({ summary: 'Obtener resumen de tareas del día actual' })
  @ApiResponse({
    status: 200,
    description: 'Resumen diario de tareas',
    type: DailySummaryDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getDailySummary(
    @CurrentUser('userId') userId: string,
  ): Promise<DailySummaryDto> {
    return this.tasksService.getDailySummary(userId);
  }

  @Get('completions')
  @ApiOperation({
    summary: 'Historial de completaciones para un rango de fechas',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de completaciones con resumen',
    type: CompletionHistoryDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getCompletionHistory(
    @CurrentUser('userId') userId: string,
    @Query() filters: FilterCompletionsDto,
  ): Promise<CompletionHistoryDto> {
    return this.tasksService.getCompletionHistory(userId, filters);
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

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar una tarea como completada' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Tarea completada exitosamente',
    type: CompleteTaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'La tarea ya fue completada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async completeTask(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @ClientIp() ipAddress: string | null,
  ): Promise<CompleteTaskResponseDto> {
    return this.tasksService.completeTask(id, userId, ipAddress);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una tarea' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Tarea editada exitosamente',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async editTask(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @ClientIp() ipAddress: string | null,
  ): Promise<TaskResponseDto> {
    return this.tasksService.editTask(id, userId, dto, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la tarea' })
  @ApiResponse({
    status: 200,
    description: 'Tarea eliminada exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @ClientIp() ipAddress: string | null,
  ): Promise<MessageResponseDto> {
    return this.tasksService.removeByUser(id, userId, ipAddress);
  }
}
