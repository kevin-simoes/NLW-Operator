import { ImageResponse } from "@takumi-rs/image-response";
import { getRoastById } from "@/db/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "true";
  const roast = await getRoastById(id);

  if (!roast) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          color: "#6b7280",
          fontSize: 32,
        }}
      >
        Roast not found
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  }

  const scoreColor =
    roast.score <= 3 ? "#ef4444" : roast.score <= 6 ? "#f59e0b" : "#10b981";

  const topIssue = roast.items[0];
  const verdictLabel = roast.verdict.replace(/_/g, " ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        padding: "48px",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{ color: "#10b981", fontSize: "36px", fontWeight: "bold" }}
          >
            {">"}
          </span>
          <span
            style={{ color: "#fafafa", fontSize: "36px", fontWeight: "bold" }}
          >
            devroast
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#6b7280", fontSize: "24px" }}>
            lang: {roast.language}
          </span>
          <span style={{ color: "#6b7280", fontSize: "24px" }}>·</span>
          <span style={{ color: "#6b7280", fontSize: "24px" }}>
            {roast.lineCount} lines
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          gap: "48px",
        }}
      >
        <div
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: `8px solid ${scoreColor}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#141414",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: "16px" }}>SCORE</span>
          <span
            style={{
              color: scoreColor,
              fontSize: "64px",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {roast.score.toFixed(1)}
          </span>
          <span style={{ color: "#6b7280", fontSize: "18px" }}>/10</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          <p
            style={{
              color: "#fafafa",
              fontSize: "32px",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            "{roast.roastQuote}"
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                backgroundColor: scoreColor,
                color: "#0a0a0a",
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              verdict: {verdictLabel}
            </span>
          </div>
        </div>
      </div>

      {topIssue && (
        <div
          style={{
            marginTop: "24px",
            padding: "16px 24px",
            backgroundColor: "#141414",
            borderRadius: "8px",
            borderLeft: `4px solid ${
              topIssue.severity === "critical"
                ? "#ef4444"
                : topIssue.severity === "warning"
                  ? "#f59e0b"
                  : "#10b981"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: "20px" }}>Analysis:</span>
          <span style={{ color: "#fafafa", fontSize: "20px" }}>
            {topIssue.title}
          </span>
        </div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
      ...(shouldDownload && {
        headers: {
          "Content-Disposition": `attachment; filename="devroast-${roast.id.slice(0, 8)}.png"`,
        },
      }),
    },
  );
}
