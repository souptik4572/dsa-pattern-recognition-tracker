import { authorize, AuthorizationError } from "@/server/auth";
import { exportProgress } from "@/server/progress";

export async function GET() {
  try {
    const user = await authorize();
    const data = await exportProgress(user.id);
    const date = data.exportedAt.slice(0, 10);

    return new Response(`${JSON.stringify(data, null, 2)}\n`, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pattern-tracker-progress-${date}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}
