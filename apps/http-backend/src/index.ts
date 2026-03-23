import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cors from "cors";

import { JWT_SECRET } from "@repo/secret/config";
import { middleware } from "./middleware";
import {
  createUserSchema,
  signinSchema,
  createRoomSchema,
} from "@repo/common/test";
import { prismaClient } from "@repo/db/client";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/signup", async (req: Request, res: Response) => {
  const parseData = createUserSchema.safeParse(req.body);

  if (!parseData.success) {
    return res.json({
      message: "Invalid Credentail!!",
      error: parseData.error,
    });
  }

  const { email, name, password } = req.body;

  const check = await prismaClient.user.findFirst({
    where: {
      email,
    },
  });

  if (check)
    return res.json({
      message: "User with this email is already exist!!",
    });

  const hashpassword = await bcrypt.hash(password, 10);

  try {
    const response = await prismaClient.user.create({
      data: {
        email,
        name,
        password: hashpassword,
      },
    });

    return res.json({
      response,
      message: "Signup successfully!!",
    });
  } catch (e) {
    return res.json({
      message: "Something went wrong!!",
      error: e,
    });
  }
});

app.post("/signin", async (req: Request, res: Response) => {
  const data = signinSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Invalid Credentail!!",
      error: data.error,
    });
  }

  const { email, password } = req.body;

  try {
    // check the user is registerd or not with this email
    const user = await prismaClient.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return res.json({
        message: "User not found!!",
      });
    }

    // check the password is correct or not
    const checkpassword = await bcrypt.compare(password, user.password);

    if (!checkpassword) {
      return res.json({
        message: "Invalid Credentail!!",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
      },
      JWT_SECRET!,
    );

    return res.json({
      token,
    });
  } catch (e) {
    return res.json({
      message: "Something went wrong!!",
      error: e,
    });
  }
});

app.post("/create-room", middleware, async (req: Request, res: Response) => {
  const data = createRoomSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Invalid Credentail!!",
      error: data.error,
    });
  }

  const slug = req.body.name;
  // @ts-ignore
  const adminId = req.userId;

  try {
    const response = await prismaClient.room.create({
      data: {
        slug,
        adminId,
        user: {
          connect: {
            id: adminId,
          },
        },
      },
    });

    return res.json({
      slug,
      roomId: response.id,
      message: "Successfully Create the room",
    });
  } catch (e) {
    return res.json({
      message: "Something went wrong!!",
      error: e,
    });
  }
});

app.get("/shapes/:roomId", async (req: Request, res: Response) => {
  const roomId = Number(req.params.roomId);

  if (isNaN(roomId)) {
    return res.status(400).json({ message: "Invalid room ID" });
  }

  const messages = await prismaClient.chat.findMany({
    where: {
      roomId,
    },
    orderBy: {
      id: "desc",
    },
    take: 50,
  });

  return res.json({
    messages,
  });
});

app.get("/room/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);

  const room = await prismaClient.room.findFirst({
    where: {
      slug,
    },
  });

  return res.json({
    roomId: room?.id,
  });
});

app.get("/user-room", middleware, async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.userId;

  const userWithRooms: {
    userRoom: {
      slug: string;
    }[];
  } | null = await prismaClient.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      userRoom: true,
    },
  });

  return res.json({
    rooms: userWithRooms?.userRoom,
  });
});

app.post("/join-room", middleware, async (req: Request, res: Response) => {
  const { name } = req.body;

  const room = await prismaClient.room.findFirst({
    where: {
      slug: name,
    },
  });

  if (!room) {
    return res.json({
      message: "Room not found!!",
    });
  }

  const roomId = room.id;
  // @ts-ignore
  const userId = req.userId;

  try {
    const response = await prismaClient.room.update({
      where: {
        id: roomId,
      },
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    if (!response) {
      return res.json({
        message: "Room not found!!",
      });
    }

    return res.json({
      message: "Successfully joined the room",
    });
  } catch (e) {
    return res.json({
      message: "Something went wrong!!",
      error: e,
    });
  }
});

app.listen(3001);
