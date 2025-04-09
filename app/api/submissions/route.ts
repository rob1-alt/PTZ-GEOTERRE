import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Chemin vers le fichier JSON
    const dataFilePath = path.join(process.cwd(), "data", "submissions.json")

    // Vérifier si le fichier existe
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ submissions: [] })
    }

    // Lire le fichier
    const data = fs.readFileSync(dataFilePath, "utf8")
    const submissions = JSON.parse(data)

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Erreur lors de la récupération des soumissions:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des données" }, { status: 500 })
  }
}
