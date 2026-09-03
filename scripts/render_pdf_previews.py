from __future__ import annotations

from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "output" / "pdf"
PREVIEW_ROOT = ROOT / "tmp" / "pdfs"


def render(pdf_path: Path) -> None:
    output_dir = PREVIEW_ROOT / pdf_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)
    document = fitz.open(pdf_path)
    thumbs: list[Image.Image] = []

    for index, page in enumerate(document):
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        page_path = output_dir / f"page-{index + 1:03d}.png"
        pixmap.save(page_path)
        image = Image.open(page_path).convert("RGB")
        image.thumbnail((280, 396))
        canvas = Image.new("RGB", (300, 430), "#E8E7E3")
        canvas.paste(image, ((300 - image.width) // 2, 10))
        draw = ImageDraw.Draw(canvas)
        draw.text((12, 407), f"{index + 1}", fill="#111113")
        thumbs.append(canvas)

    columns = 4
    rows = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * 300, rows * 430), "#F1F0ED")
    for index, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((index % columns) * 300, (index // columns) * 430))
    sheet.save(output_dir / "contact-sheet.png")
    print(f"Rendered {len(document)} pages: {output_dir}")


def main() -> None:
    for pdf_path in sorted(PDF_DIR.glob("*.pdf")):
        render(pdf_path)


if __name__ == "__main__":
    main()
