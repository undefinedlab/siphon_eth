export async function createStrategy(strategyData: any) {
  try {
    const response = await fetch("http://localhost:5003/generatePayload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(strategyData),
    });

    const text = await response.text();

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    const data = JSON.parse(text);
    console.log("Payload Generator response:", data);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to call payload generator:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
