type TelegramUpdatesResponse = {
  ok: boolean;
  result?: {
    update_id: number;
    message?: {
      chat?: {
        id: number;
        type?: string;
        title?: string;
        first_name?: string;
        username?: string;
      };
      text?: string;
    };
  }[];
};

export async function getLatestTelegramChatId(botToken: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?limit=20`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as TelegramUpdatesResponse;

  if (!payload.ok || !payload.result?.length) {
    return null;
  }

  const latestChat = payload.result
    .slice()
    .reverse()
    .find((update) => update.message?.chat?.id)?.message?.chat;

  if (!latestChat) {
    return null;
  }

  return {
    id: String(latestChat.id),
    label:
      latestChat.title ??
      latestChat.first_name ??
      latestChat.username ??
      "Telegram chat",
  };
}

export async function sendTelegramTextMessage({
  botToken,
  chatId,
  text,
}: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  return response.ok;
}
