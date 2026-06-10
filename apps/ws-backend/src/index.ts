import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

const checkUser = (token: string): string | null => {
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET!);

    // know that it has to be jwtPlayload/object but if it string then close the ws connection because we load using some object
    if (typeof decode == "string") {
      return null;
    }

    if (!decode || !decode.id) {
      return null;
    }
    return decode.id as string;
  } catch (e) {
    return JSON.stringify({
      error: "error",
      message: "Invalid Token!!",
    });
  }
};

interface User {
  ws: WebSocket;
  roomIds: number[];
  userId: string;
}

let users: User[] = [];

wss.on("connection", function connection(ws, request) {
  const url = request.url;

  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token");

  if (!token) {
    ws.close();
    return;
  }

  const userId = checkUser(token);

  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    roomIds: [],
    ws,
  });

  ws.on("message", async function message(data) {
    // data we get is string so we convert into json (object)
    const parseData = JSON.parse(data as unknown as string);

    // for join the room
    if (parseData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      user?.roomIds.push(parseData.roomId);
    }

    // for leave the room
    if (parseData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) return;
      user.roomIds = user.roomIds.filter((x) => x !== parseData.roomId);
    }

    // for Chat
    if (parseData.type === "chat") {
      const roomId = parseData.roomId;
      const message = parseData.message;

      await prismaClient.chat.create({
        data: {
          message,
          roomId,
          userId,
        },
      });

      const sender = users.find((u) => u.ws === ws);
      if (!sender) return;

      if (!sender.roomIds.includes(roomId)) {
        ws.send(
          JSON.stringify({
            type: "error!!",
            message: "you are not the part of that room!!",
          })
        );
        return;
      }

      users.forEach((user) => {
        if (user.roomIds.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    // remove user from users list
    users = users.filter((u) => u.ws !== ws);
    ws.send(
      JSON.stringify({
        Message: "Disconnected!!",
      })
    );
  });
});
