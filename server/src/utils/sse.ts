import { Response } from "express";

type Client = { id: string; res: Response };
const clients: Client[] = [];

export function addClient(res: Response): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  clients.push({ id, res });
  return id;
}

export function removeClient(id: string) {
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) clients.splice(idx, 1);
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const { res } of clients) {
    try { res.write(payload); } catch {}
  }
}
