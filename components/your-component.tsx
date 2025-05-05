import Image from "next/image"
import Link from "next/link"

export function ImageLink() {
  return (
    <Link href="/votre-lien" className="block relative w-[300px] h-[200px]">
      <Image
        src="/image.png"
        alt="Description de l'image"
        fill
        className="object-cover"
      />
    </Link>
  )
} 