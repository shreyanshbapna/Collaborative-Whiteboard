import axios from "axios";

export const getRoomId = async (slug: string): Promise<number> => {
  const response = await axios.get(`${process.env.INTERNAL_HTTP_URL}/room/${slug}`);
  return response.data.roomId;
};

export async function getExistingShape(roomId: number) {
  const shapes = await axios.get(`${process.env.NEXT_PUBLIC_HTTP_URL}/shapes/${roomId}`);
  return shapes.data.messages.map((s: { message: string }) => {
    return JSON.parse(s.message);
  });
}