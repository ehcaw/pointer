import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

interface UserInfo {
  id: string;
  name?: string;
  color?: string;
  avatar?: string;
}

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {
    // PartyKit storage doesn't have setTimeout method
    // We'll handle timeouts on the connection level
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`New connection to room: ${this.room.id}, user: ${conn.id}`);

    // y-partykit passes user info through the connection's partykit info
    // The user info comes from the client when they connect
    return onConnect(conn, this.room, {
      readOnly: false,
      // y-partykit will automatically handle user awareness
      // when the client provides user info
    });
  }

  onConnectionClose(conn: Party.Connection) {
    console.log(`Connection closed for user: ${conn.id} in room: ${this.room.id}`);
  }

  // Optional: Handle authentication/authorization
  async onRequest(req: Party.Request) {
    // You could add auth middleware here if needed
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      // Return basic health info. Avoid leaking sensitive data.
      return new Response(
        JSON.stringify({ status: "ok", time: new Date().toISOString() }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    return new Response("OK", { status: 200 });
  }
}
