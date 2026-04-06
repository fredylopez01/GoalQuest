import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { GoalResponseDto } from './dto/goal-response.dto';
import { CreateGoalDto } from './dto/create-goal.dto';

@ApiTags('Goals')
@ApiBearerAuth()
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
  async createGoal(@Body() dto: CreateGoalDto): Promise<GoalResponseDto> {
    const goal = await this.goalsService.createGoal('user-id-placeholder', dto);
    const goalResponse: GoalResponseDto = {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      description: goal.description,
      endDate: goal.endDate,
      state: goal.state,
      maxDaysLater: goal.maxDaysLater,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
    return goalResponse;
  }
}
