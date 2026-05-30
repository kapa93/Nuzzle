import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const PUSH_CHUNK_SIZE = 100;

type NotificationType =
  | 'COMMENT'
  | 'REACTION'
  | 'COMMENT_REACTION'
  | 'MEETUP_RSVP'
  | 'DOG_INTERACTION'
  | 'NEW_BREED_POST'
  | 'NEW_PLACE_POST';

interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
}

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

function buildMessage(
  token: string,
  type: NotificationType,
  actorName: string,
  postId: string | null
): PushMessage {
  const data: Record<string, unknown> = {};
  if (postId) data.postId = postId;

  const messages: Record<NotificationType, { title: string; body: string }> = {
    COMMENT: { title: 'New comment', body: `${actorName} commented on your post` },
    REACTION: { title: 'New reaction', body: `${actorName} reacted to your post` },
    COMMENT_REACTION: { title: 'New reaction', body: `${actorName} reacted to your comment` },
    MEETUP_RSVP: { title: 'New RSVP', body: `${actorName} joined your meetup` },
    DOG_INTERACTION: { title: 'Dog meetup!', body: `${actorName}'s dog met your dog` },
    NEW_BREED_POST: { title: 'New post', body: `${actorName} posted in a breed you follow` },
    NEW_PLACE_POST: { title: 'New post', body: `${actorName} posted at a place you saved` },
  };

  const { title, body } = messages[type];
  return { to: token, title, body, data, sound: 'default' };
}

async function sendChunk(messages: PushMessage[]): Promise<ExpoPushTicket[]> {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    throw new Error(`Expo push API error: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  console.log('Expo push tickets:', JSON.stringify(json.data));
  return json.data as ExpoPushTicket[];
}

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    // Supabase Database Webhooks send the row under payload.record
    const notification = (payload.record ?? payload) as NotificationRow;

    if (!notification?.user_id || !notification?.type) {
      return new Response('Missing notification fields', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch push tokens for the recipient
    const { data: tokenRows, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', notification.user_id);

    if (tokenError) throw tokenError;
    if (!tokenRows || tokenRows.length === 0) {
      return new Response('No push tokens', { status: 200 });
    }

    // Fetch actor name
    const { data: actorRow } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', notification.actor_id)
      .single();

    const actorName: string = actorRow?.name ?? 'Someone';

    // Build and send messages in chunks
    const messages = tokenRows.map((row: { id: string; token: string }) =>
      buildMessage(row.token, notification.type, actorName, notification.post_id)
    );

    const staleTokenIds: string[] = [];

    for (let i = 0; i < messages.length; i += PUSH_CHUNK_SIZE) {
      const chunk = messages.slice(i, i + PUSH_CHUNK_SIZE);
      const chunkTokenRows = tokenRows.slice(i, i + PUSH_CHUNK_SIZE);

      let tickets: ExpoPushTicket[];
      try {
        tickets = await sendChunk(chunk);
      } catch (err) {
        console.error('Failed to send push chunk:', err);
        continue;
      }

      // Collect receipt IDs so we can check for DeviceNotRegistered later
      const receiptIds = tickets
        .filter((t) => t.status === 'ok' && t.id)
        .map((t) => t.id as string);

      if (receiptIds.length > 0) {
        try {
          const receiptsRes = await fetch(EXPO_RECEIPTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: receiptIds }),
          });
          if (receiptsRes.ok) {
            const receiptsJson = await receiptsRes.json();
            const receipts = receiptsJson.data as Record<string, ExpoPushTicket>;
            for (const [idx, ticket] of tickets.entries()) {
              if (!ticket.id) continue;
              const receipt = receipts[ticket.id];
              if (receipt?.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
                staleTokenIds.push(chunkTokenRows[idx].id);
              }
            }
          }
        } catch {
          // Receipt check is best-effort; don't fail the whole request
        }
      }
    }

    // Clean up stale tokens
    if (staleTokenIds.length > 0) {
      await supabase.from('push_tokens').delete().in('id', staleTokenIds);
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('send-push-notification error:', err);
    return new Response(String(err), { status: 500 });
  }
});
