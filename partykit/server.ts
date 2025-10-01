import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class YjsServer implements Party.Server {
  constructor(public room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    console.log("New connection to room:", this.room.id);
    return onConnect(conn, this.room, {
      // Minimal config for debugging
      readOnly: false,
    });
  }
}
