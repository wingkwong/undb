import { Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { IEvent } from '@undb/domain'
import { Webhook, type IWebhookSignService } from '@undb/integrations'
import crypto from 'crypto'
import { InjectWebhookConfig, webhookConfig } from '../configs/webhook.config.js'

@Injectable()
export class WebhookSignatureService implements IWebhookSignService {
  constructor(
    @InjectWebhookConfig()
    private readonly config: ConfigType<typeof webhookConfig>,
  ) {}

  public sign(webhook: Webhook, event: IEvent): string {
    const body = webhook.constructEvent(event)
    const secret = this.config.secret ?? 'secret'

    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(event.timestamp.toISOString() + '.' + JSON.stringify(body)))
      .digest('hex')
    return 'undb_' + signature
  }
}
