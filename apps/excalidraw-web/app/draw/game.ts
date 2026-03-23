import { Shape } from "./index";
import { getExistingShape } from "../lib/api";

type shape = "rect" | "line" | "circle" | "text";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private setInputBox: React.Dispatch<React.SetStateAction<boolean>>;
  private setTypes: React.Dispatch<React.SetStateAction<string>>;
  private socket: WebSocket;
  private roomId: number;
  public type: shape;
  private clicked: boolean;
  public  InitialX: number;
  public InitialY: number;
  private existingShapes: Shape[];
  private text: string;

  constructor(canvas: HTMLCanvasElement, roomId: number, socket: WebSocket, setInputBox: React.Dispatch<React.SetStateAction<boolean>>, setTypes:  React.Dispatch<React.SetStateAction<string>>){
    this.canvas = canvas;
    this.setInputBox = setInputBox;
    this.setTypes = setTypes;
    this.ctx = canvas.getContext("2d")!;
    this.type = "rect";
    this.clicked = false;
    this.InitialX = 0;
    this.InitialY = 0;
    this.text = "";
    this.roomId = roomId;
    this.socket = socket;
    this.existingShapes = [];
    this.init();
    this.clearCanvas();
    this.mouseHandler();
    this.setType(this.type);
    this.initHandler();
  }

  finalizeText() {
    if (!this.text.trim()) return;
  
    const shape: Shape = {
      type: "text",
      startX: this.InitialX,
      startY: this.InitialY,
      text: this.text,
    };
  
    this.socket.send(
      JSON.stringify({
        type: "chat",
        roomId: this.roomId,
        message: JSON.stringify(shape),
      })
    );
  
    this.text = "";
    this.setInputBox(false);
  }

  initHandler() {
    this.socket.onmessage = (event) => {
      const chats = JSON.parse(event.data);
      if (chats.type === "chat") {
        const shape = JSON.parse(chats.message);
        this.existingShapes.push(shape);
        this.clearCanvas();
      }
    };
  }
  setType(type: shape) {
    this.setTypes(type);
    this.type = type;
  }

  setText(text: string) {
    this.text = text;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // black
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.forEach((shape) => {
      
      // set stroke(bountry of shape to white color)
      this.ctx.strokeStyle = "rgba(255, 255, 255)";

      // for rectangle
      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
      // for circle
      else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          shape.radius,
          0,
          2 * Math.PI
        );
        this.ctx.stroke();
      }

      // for line
      else if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
      }
      // for text
      else if (shape.type === "text") {
        this.ctx.font = "25px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.fillText(shape.text, shape.startX, shape.startY);
      }
    });
  }

  async init() {
    this.existingShapes = await getExistingShape(this.roomId);
    this.clearCanvas();
  }

  handleMouseDown = (e: MouseEvent) => {
    this.clicked = true;
    this.InitialX = e.clientX;
    this.InitialY = e.clientY;
  }

  handleMouseUp = (e: MouseEvent) => {
    this.clicked = false;

    let shape: Shape | undefined;

    if (this.type === "rect") {
      shape = {
        type: this.type,
        width: e.clientX - this.InitialX,
        height: e.clientY - this.InitialY,
        x: this.InitialX,
        y: this.InitialY,
      };
    } 
    else if (this.type === "circle") {
      const radius =
        Math.sqrt(
          Math.pow(e.clientX - this.InitialX, 2) +
            Math.pow(e.clientY - this.InitialY, 2)
        ) / 2;

      shape = {
        type: this.type,
        centerX: (e.clientX + this.InitialX) / 2,
        centerY: (e.clientY + this.InitialY) / 2,
        radius: radius,
      };
    } 
    else if (this.type === "line") {
      shape = {
        type: this.type,
        startX: this.InitialX,
        startY: this.InitialY,
        endX: e.clientX,
        endY: e.clientY,
      };
    } 
    else if (this.type === "text") {
      this.setInputBox(true);
      return;
    }

    if (shape) {
      this.socket.send(
        JSON.stringify({
          type: "chat",
          roomId: this.roomId,
          message: JSON.stringify(shape),
        })
      );
    }
  }

  handleMouseMove = (e: MouseEvent) => {
    if (this.clicked) {
      this.clearCanvas();

      // set stroke(bountry of shape to white color)
      this.ctx.strokeStyle = "rgba(255, 255, 255)";

      // rectangle logic
      if (this.type === "rect") {
        this.ctx.strokeRect(
          this.InitialX,
          this.InitialY,
          e.clientX - this.InitialX,
          e.clientY - this.InitialY
        );
      }
      //  circle logic
      else if (this.type === "circle") {
        this.ctx.beginPath();
        const radius =
          Math.pow(
            Math.pow(e.clientX - this.InitialX, 2) +
              Math.pow(e.clientY - this.InitialY, 2),
            1 / 2
          ) / 2;
        this.ctx.arc(
          (e.clientX + this.InitialX) / 2,
          (e.clientY + this.InitialY) / 2,
          radius,
          0,
          2 * Math.PI
        );
        this.ctx.stroke();
      }
      // line logic
      else if (this.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(this.InitialX, this.InitialY);
        this.ctx.lineTo(e.clientX, e.clientY);
        this.ctx.stroke();
      }
    }
  }

  mouseHandler() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
  }
}
