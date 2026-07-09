import {GalleryVerticalEnd} from "lucide-react";

export default function Logo(){
    return(
    <a className="flex items-center gap-3 font-semibold text-lg text-[hsl(var(--tertiary))]">
        <div className="flex size-8 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md">
          <GalleryVerticalEnd className="size-5" />
        </div>
        Wijha West
    </a>
    )
}