export default function GameLayout({
  children,
  background,
  fontFamily,
  padding = "16px",
  align = "center",
  justify = "flex-start",
  style,
  styleContent,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background,
        fontFamily,
        padding,
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        justifyContent: justify,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {styleContent ? <style>{styleContent}</style> : null}
      {children}
    </div>
  );
}
