import { getSheetUrl } from "@/actions/store-submission"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await getSheetUrl()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'URL du Google Sheet:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de l'URL" }, { status: 500 })
  }
}
