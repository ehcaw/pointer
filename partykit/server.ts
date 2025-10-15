import type * as Party from "partykit/server";

export default class TestServer implements Party.Server {
  constructor(public room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Connection ${conn.id} joined room ${this.room.id}`);

    // Send a welcome message
    conn.send(
      JSON.stringify({
        type: "welcome",
        message: "Connected to PartyKit server",
        roomId: this.room.id,
        connectionId: conn.id,
      }),
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`Message from ${sender.id}: ${message}`);

    // Broadcast message to all connections in the room
    this.room.broadcast(message, [sender.id]);
  }

  onClose(connection: Party.Connection) {
    console.log(`Connection ${connection.id} left room ${this.room.id}`);
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          room: this.room.id,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
