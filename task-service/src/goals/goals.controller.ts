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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { GoalResponseDto } from './dto/goal-response.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ClientIp } from 'src/common/decorators/client-ip.decorator';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva meta' })
  @ApiResponse({
    status: 201,
    description: 'Meta creada exitosamente',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createGoal(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateGoalDto,
    @ClientIp() ipAddress: string | null,
  ): Promise<GoalResponseDto> {
    return this.goalsService.createGoal(userId, dto, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las metas del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de metas',
    type: [GoalResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @CurrentUser('userId') userId: string,
  ): Promise<GoalResponseDto[]> {
    return this.goalsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una meta' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la meta',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta meta' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GoalResponseDto> {
    return this.goalsService.findOneByUser(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar una meta existente' })
  @ApiResponse({
    status: 200,
    description: 'Meta editada exitosamente',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta meta' })
  async editGoal(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dataToUpdate: Partial<CreateGoalDto>,
    @ClientIp() ipAddress: string | null,
  ): Promise<GoalResponseDto> {
    return this.goalsService.editGoal(id, userId, dataToUpdate, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una meta y todas sus tareas asociadas' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la meta' })
  @ApiResponse({
    status: 200,
    description: 'Meta eliminada exitosamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta meta' })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @ClientIp() ipAddress: string | null,
  ): Promise<MessageResponseDto> {
    return this.goalsService.removeByUser(id, userId, ipAddress);
  }
}
