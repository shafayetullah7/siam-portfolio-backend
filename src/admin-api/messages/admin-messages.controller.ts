import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminMessagesService } from './admin-messages.service';
import {
  listMessagesQuerySchema,
  type ListMessagesQuery,
} from './dto/list-messages-query.dto';
import { messageIdParamSchema } from './dto/message-id-params.dto';
import {
  bulkUpdateMessagesBodySchema,
  type BulkUpdateMessagesBody,
} from './dto/bulk-update-messages-body.dto';
import {
  updateMessageBodySchema,
  type UpdateMessageBody,
} from './dto/update-message-body.dto';

@ApiTags('admin-messages')
@Controller('admin/messages')
@UseGuards(AdminAuthGuard)
export class AdminMessagesController {
  constructor(private readonly messages: AdminMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List contact inbox messages (paginated)' })
  async list(@Query({ schema: listMessagesQuerySchema }) query: ListMessagesQuery) {
    return await this.messages.list(query);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk update message status or read flag' })
  async bulkUpdate(
    @Body({ schema: bulkUpdateMessagesBodySchema }) body: BulkUpdateMessagesBody,
  ) {
    return await this.messages.bulkUpdate(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message detail (marks non-spam unread as read)' })
  async get(@Param('id', { schema: messageIdParamSchema }) id: string) {
    return await this.messages.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message status, read flag, or admin notes' })
  async update(
    @Param('id', { schema: messageIdParamSchema }) id: string,
    @Body({ schema: updateMessageBodySchema }) body: UpdateMessageBody,
  ) {
    return await this.messages.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete a message' })
  async delete(@Param('id', { schema: messageIdParamSchema }) id: string) {
    await this.messages.delete(id);
    return null;
  }
}
