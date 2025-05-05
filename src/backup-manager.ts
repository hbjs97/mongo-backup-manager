import * as AWS from 'aws-sdk'
import { exec } from 'child_process'
import { createReadStream, existsSync, mkdirSync } from 'fs'
import { readdir } from 'fs/promises'
import path, { join } from 'path'
import { SlackClient } from './slack-client'
import { DumpFailMessage, DumpSuccessMessage } from './messages'
import { Config } from './config'

export class BackupManager {
  private readonly s3: AWS.S3
  private readonly backupDir: string
  private readonly config = new Config()

  constructor(private readonly slack?: SlackClient) {
    this.s3 = new AWS.S3({
      region: this.config.storage.region,
      accessKeyId: this.config.storage.accessKeyId,
      secretAccessKey: this.config.storage.secretAccessKey,
      maxRetries: 3,
    })

    this.backupDir = join(__dirname, this.config.backup.dir ?? 'backup')
  }

  private localDate(date: Date = new Date()): string {
    const yyyy = date.getFullYear()
    const MM = String(date.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 1을 더하고, 두 자리로 맞춤
    const dd = String(date.getDate()).padStart(2, '0') // 일을 두 자리로 맞춤
    const hh = String(date.getHours()).padStart(2, '0') // 시를 두 자리로 맞춤
    const mm = String(date.getMinutes()).padStart(2, '0') // 분을 두 자리로 맞춤
    const ss = String(date.getSeconds()).padStart(2, '0') // 초를 두 자리로 맞춤
    return `${yyyy}${MM}${dd}-${hh}:${mm}:${ss}`
  }

  backup() {
    this.makeBackupDir(this.backupDir)
    const backupPath = join(this.backupDir, this.localDate())
    const command = `mongodump --uri='${this.config.mongo.uri}' --db='${this.config.mongo.db}' --out='${backupPath}'`
    console.log(`Backup command: ${command}`)
    exec(command, async (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`Backup error: ${error.message}`)
        await this.slack?.send(new DumpFailMessage(command, error.message))
        process.exit(1)
      }

      console.log('Backup created:', backupPath)
      const [uploadPath, result] = await this.uploadToS3(backupPath, this.config.mongo.db)
      await this.slack?.send(
        new DumpSuccessMessage(uploadPath, result.map((v) => v.message).join('\n\n')),
      )
    })
  }

  private makeBackupDir(backupDir: string) {
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }
  }

  private async uploadToS3(
    backupPath: string,
    db: string,
  ): Promise<[string, { ok: boolean; message: string }[]]> {
    const localDate = path.basename(backupPath)
    const dbBackupPath = join(backupPath, db)
    const prefix = this.config.backup.prefix.replace(/^\/|\/$/g, '')
    const files = await readdir(dbBackupPath)

    const uploadPromises: Promise<{ ok: boolean; message: string }>[] = files.map(async (file) => {
      const filePath = join(dbBackupPath, file)
      const fileStream = createReadStream(filePath)

      const uploadParams = {
        Bucket: this.config.storage.bucket,
        Key: `${prefix}/${localDate}/${file}`,
        Body: fileStream,
      }

      try {
        this.s3.upload(uploadParams).promise()
        return { ok: true, message: `:white_check_mark: ${file}` }
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error)
        return { ok: false, message: `:error: ${file}` }
      }
    })

    const results = await Promise.all(uploadPromises)
    console.log('Upload results:', results)
    return [`s3://${this.config.storage.bucket}/${prefix}/${localDate}`, results]
  }
}
