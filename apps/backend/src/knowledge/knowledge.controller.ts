import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { KnowledgeService } from './knowledge.service'
import { CreateKnowledgeBaseDto, SearchKnowledgeDto } from './knowledge.dto'

interface UploadedMulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
}

@ApiTags('知识库')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('bases')
  createKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    return this.knowledgeService.createKnowledgeBase(dto)
  }

  @Get('bases/:kbCode')
  getKnowledgeBase(@Param('kbCode') kbCode: string) {
    return this.knowledgeService.getKnowledgeBase(kbCode)
  }

  @Get('bases/:kbCode/documents')
  listDocuments(@Param('kbCode') kbCode: string) {
    return this.knowledgeService.listDocuments(kbCode)
  }

  @Post('bases/:kbCode/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('kbCode') kbCode: string,
    @UploadedFile() file: UploadedMulterFile | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('文件不能为空')
    }
    return this.knowledgeService.uploadDocument(
      kbCode,
      file.originalname,
      file.buffer,
      file.mimetype,
    )
  }

  @Delete('documents/:docId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDocument(@Param('docId') docId: string) {
    return this.knowledgeService.deleteDocument(docId)
  }

  @Post('bases/:kbCode/search')
  searchKnowledge(@Param('kbCode') kbCode: string, @Body() dto: SearchKnowledgeDto) {
    return this.knowledgeService.search(
      kbCode,
      dto.query,
      dto.top_k ?? 5,
      dto.score_threshold ?? 0.3,
    )
  }

  @Get('health')
  health() {
    return this.knowledgeService.health()
  }
}
