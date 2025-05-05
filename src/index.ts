import { BackupManager } from './backup-manager'
import { SlackClient } from './slack-client'
;(async () => {
  const slack = await SlackClient.init()
  new BackupManager(slack).backup()
})()
