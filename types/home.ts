/** A single piece of furniture placed in a room, in centimeters. */
export type FurnitureItem = {
  /** Category, e.g. "sofa", "bed", "table", "cabinet". */
  type: string;
  /** Human label shown in the UI, e.g. "3-seat sofa". */
  label: string;
  /** Footprint width (cm), measured along the room's x-axis before rotation. */
  widthCm: number;
  /** Footprint depth (cm), measured along the room's y-axis before rotation. */
  depthCm: number;
  /** Top-left x of the footprint in room-local cm coordinates. */
  xCm: number;
  /** Top-left y of the footprint in room-local cm coordinates. */
  yCm: number;
  /** Clockwise rotation in degrees (0, 90, 180, 270). */
  rotationDeg: number;
  /** Optional material/colour note for the render prompt. */
  material?: string | null;
  color?: string | null;
};

export type RoomLayout = {
  /** Free-text style summary from the AI, echoed for the render prompt. */
  styleSummary: string;
  furniture: FurnitureItem[];
};

export type DesignStatus = "draft" | "saved";

export type RoomDesign = {
  id: string;
  roomId: string;
  apartmentId: string;
  title: string;
  stylePrompt: string;
  layout: RoomLayout;
  /** Validation warnings, if the layout could not be made fully compliant. */
  warnings: string[];
  status: DesignStatus;
  createdAt: string;
  updatedAt: string;
};

export type DesignRender = {
  id: string;
  designId: string;
  prompt: string;
  /** Signed URL to the render image (short-lived). */
  url: string | null;
  createdAt: string;
};
