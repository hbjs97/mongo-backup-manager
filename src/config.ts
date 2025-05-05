import dotenv from 'dotenv'
import { Singleton } from './util'

dotenv.config()

export interface BackupConfig {
  prefix: string
  dir?: string
}

export interface MongoConfig {
  uri: string
  db: string
}

export interface StorageConfig {
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export interface SlackConfig {
  botToken: string
  channelId: string
}

@Singleton
export class Config {
  readonly backup: BackupConfig
  readonly mongo: MongoConfig
  readonly storage: StorageConfig
  readonly slack?: SlackConfig

  constructor() {
    this.backup = {
      prefix: process.env['BACKUP_PREFIX']!,
      dir: process.env['BACKUP_DIR'],
    }

    this.mongo = {
      uri: process.env['MONGO_URI']!,
      db: process.env['MONGO_DB']!,
    }

    this.storage = {
      region: process.env['AWS_REGION']!,
      bucket: process.env['AWS_BUCKET']!,
      accessKeyId: process.env['AWS_ACCESS_KEY']!,
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
    }

    if (process.env['SLACK_BOT_TOKEN'] && process.env['SLACK_CHANNEL_ID']) {
      this.slack = {
        botToken: process.env['SLACK_BOT_TOKEN'],
        channelId: process.env['SLACK_CHANNEL_ID'],
      }
    } else {
      console.warn(`
      #####################################################################
      Slack configuration is missing. Slack notifications will be disabled.
      #####################################################################
      `)
    }
  }
}
