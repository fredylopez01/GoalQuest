import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { InternalServiceGuard } from '../common/guards/internal-service.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ObjectIdValidationPipe } from '../common/pipes/object-id-validation.pipe';

import { CreateChallengeDto } from './dto/create-challenge.dto';
import { QueryChallengesDto } from './dto/query-challenges.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  // CS-01: Crear desafío
  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createChallenge(
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.createChallenge(dto, user);
  }

  // CS-02: Listar desafíos
  @Get()
  @UseGuards(AuthGuard)
  async getChallenges(
    @Query() query: QueryChallengesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallenges(query, user);
  }

  // CS-03: Detalle de un desafío
  @Get(':id')
  @UseGuards(AuthGuard)
  async getChallengeDetail(
    @Param('id', ObjectIdValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.getChallengeDetail(id, user);
  }

  // CS-04: Aceptar desafío
  @Patch(':id/accept')
  @UseGuards(AuthGuard)
  async acceptChallenge(
    @Param('id', ObjectIdValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.acceptChallenge(id, user);
  }

  // CS-05: Rechazar desafío
  @Patch(':id/reject')
  @UseGuards(AuthGuard)
  async rejectChallenge(
    @Param('id', ObjectIdValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.rejectChallenge(id, user);
  }

  // CS-06: Cancelar desafío
  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async cancelChallenge(
    @Param('id', ObjectIdValidationPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.challengesService.cancelChallenge(id, user);
  }

  // CS-07: Actualizar progreso (interno)
  @Post('update-progress')
  @UseGuards(InternalServiceGuard)
  async updateProgress(@Body() dto: UpdateProgressDto) {
    return this.challengesService.updateProgress(dto);
  }

  // CS-08: Verificar expirados (interno/CRON)
  @Post('check-expired')
  @UseGuards(InternalServiceGuard)
  async checkExpired() {
    return this.challengesService.checkExpired();
  }
}
