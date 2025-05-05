import { Block, KnownBlock } from '@slack/web-api'
import { BlockMessage } from './block-message'

export class DumpSuccessMessage implements BlockMessage {
  readonly fallbackText: string
  readonly blocks: (Block | KnownBlock)[]

  constructor(uploadPath: string, message: string) {
    this.fallbackText = `:white_check_mark: Success to mongodump`
    this.blocks = [
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Backup successful: ${uploadPath}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ]
  }
}
