import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email = "", focus = "", notes = "", resumeText = "", atsScore = 0 } = body;

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      // Build discord notification card
      const embed = {
        title: "🚨 New Human Resume Roast Request!",
        color: 16536095, // Orange/Flame color hex in decimal
        fields: [
          { name: "Candidate Email", value: email || "Anonymous", inline: true },
          { name: "Reviewer Vibe Focus", value: focus || "General", inline: true },
          { name: "Current ATS Score", value: `${atsScore}%`, inline: true },
          { name: "Candidate Notes/Comments", value: notes || "(None provided)" },
          { name: "Resume Text Preview", value: resumeText.substring(0, 1000) + "..." }
        ],
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] })
      });
      
      console.log("Successfully broadcasted human review request to Discord channel.");
    } else {
      console.log("Discord webhook not configured. Simulation Mode active.");
    }

    return NextResponse.json({
      success: true,
      message: "Human review request broadcasted successfully."
    });
  } catch (err: any) {
    console.error("Failed to process human review request:", err);
    return NextResponse.json(
      { error: "Submission failed. Please try again. " + (err.message || "") },
      { status: 500 }
    );
  }
}
