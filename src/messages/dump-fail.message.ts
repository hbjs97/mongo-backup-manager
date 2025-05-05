import { Block, KnownBlock } from '@slack/web-api'
import { BlockMessage } from './block-message'

export class DumpFailMessage implements BlockMessage {
  readonly fallbackText: string
  readonly blocks: (Block | KnownBlock)[]

  constructor(command: string, message: string) {
    this.fallbackText = `:error: Failed to mongodump`
    this.blocks = [
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Failed to mongodump`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `command: ${command}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `error: ${message}`,
        },
      },
    ]
  }
}
