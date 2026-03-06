export default function GameContainer({
  children,
  maxWidth = 560,
  width = "100%",
  style,
}) {
  return (
    <div
      style={{
        width,
        maxWidth,
        position: "relative",
        zIndex: 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
