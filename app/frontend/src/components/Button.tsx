import "assets/css/button.css";

type ButtonProps = {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  onClick?: () => void;
  unavailable?: boolean;
  width?: string;
  height?: string;
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  unavailable = false,
  onClick,
  width = "inherit",
  height = "inherit",
  type = "button",
}: ButtonProps) {
  return (
    <button
      style={{
        width: width,
        height: height,
      }}
      className={"prevent-select button " + (unavailable ? "unavailable" : "")}
      onClick={unavailable ? undefined : onClick}
      type={type}
    >
      {children}
    </button>
  );
}
