export type ImpExpression =
  | "waving"
  | "happy"
  | "shocked"
  | "sad"
  | "angry"
  | "curious"
  | "laughing"
  | "nervous"
  | "smug"
  | "sneaky"
  | "thinking"
  | "celebrating"
  | "confident"
  | "pondering"
  | "excited"
  | "pointing"
  | "shy"
  | "joyful";

interface ImpMascotProps {
  expression?: ImpExpression;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Raze imp mascot — renders the correct expression PNG as an <img>.
 * Assets live in /public/assets/imp-expressions/<expression>.png.
 */
export default function ImpMascot({
  expression = "waving",
  className = "",
  alt,
  width,
  height,
}: ImpMascotProps) {
  return (
    <img
      src={`/assets/imp-expressions/${expression}.png`}
      alt={alt ?? `Raze imp ${expression}`}
      className={className}
      width={width}
      height={height}
      draggable={false}
      style={{ imageRendering: "auto", userSelect: "none", objectFit: "contain" }}
    />
  );
}
