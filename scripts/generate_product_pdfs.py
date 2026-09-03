from __future__ import annotations

import html
import re
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "assets" / "fonts" / "instrument-sans"
OUTPUT_DIR = ROOT / "output" / "pdf"

INK = colors.HexColor("#111113")
GRAPHITE = colors.HexColor("#5E5E66")
MUTED = colors.HexColor("#88888F")
MIST = colors.HexColor("#DEDDD9")
SOFT = colors.HexColor("#F3F2EF")
PAPER = colors.HexColor("#FFFEFC")
WHITE = colors.white
SUCCESS = colors.HexColor("#287A51")
WARNING = colors.HexColor("#9A651D")
ERROR = colors.HexColor("#B34048")


def register_fonts() -> None:
    mapping = {
        "InstrumentSans": "InstrumentSans-Regular.ttf",
        "InstrumentSans-Medium": "InstrumentSans-Medium.ttf",
        "InstrumentSans-SemiBold": "InstrumentSans-SemiBold.ttf",
        "InstrumentSans-Bold": "InstrumentSans-Bold.ttf",
    }
    for name, filename in mapping.items():
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))


def clean_text(value: str) -> str:
    return (
        value.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2011", "-")
        .replace("\u00a0", " ")
        .replace("→", "->")
        .replace("←", "<-")
    )


def inline_markup(value: str) -> str:
    value = html.escape(clean_text(value.strip()), quote=True)
    value = re.sub(r"`([^`]+)`", r'<font name="InstrumentSans-Medium" color="#303034">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r'<font name="InstrumentSans-SemiBold">\1</font>', value)
    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<link href="\2" color="#303034"><u>\1</u></link>', value)
    return value


class ZenoviDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, title: str, version: str):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=21 * mm,
            bottomMargin=19 * mm,
            title=title,
            author="Zenovi",
            subject="Documento de producto",
        )
        self.document_title = title
        self.version = version
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
            id="body",
        )
        self.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=self.draw_page)])

    def draw_page(self, canvas, doc) -> None:
        canvas.saveState()
        width, height = A4
        if doc.page > 1:
            canvas.setStrokeColor(MIST)
            canvas.setLineWidth(0.45)
            canvas.line(self.leftMargin, height - 14 * mm, width - self.rightMargin, height - 14 * mm)
            canvas.setFont("InstrumentSans-Medium", 7.5)
            canvas.setFillColor(GRAPHITE)
            canvas.drawString(self.leftMargin, height - 10.5 * mm, "ZENOVI  /  PRODUCT SYSTEM")
            canvas.drawRightString(width - self.rightMargin, height - 10.5 * mm, self.version)
            canvas.line(self.leftMargin, 12.5 * mm, width - self.rightMargin, 12.5 * mm)
            canvas.setFont("InstrumentSans", 7.2)
            canvas.setFillColor(MUTED)
            canvas.drawString(self.leftMargin, 8.2 * mm, "Confidencial - documento vivo")
            canvas.drawRightString(width - self.rightMargin, 8.2 * mm, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable) -> None:
        if isinstance(flowable, Paragraph):
            level = getattr(flowable.style, "toc_level", None)
            if level is not None:
                text = flowable.getPlainText()
                key = f"section-{self.seq.nextf('section')}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, level=level, closed=False)
                self.notify("TOCEntry", (level, text, self.page, key))


def make_styles(compact: bool = False) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    body_size = 8.35 if compact else 9.05
    leading = 11.25 if compact else 12.25
    styles: dict[str, ParagraphStyle] = {}
    styles["body"] = ParagraphStyle(
        "body",
        parent=base["BodyText"],
        fontName="InstrumentSans",
        fontSize=body_size,
        leading=leading,
        textColor=INK,
        spaceAfter=2.4 * mm,
    )
    styles["small"] = ParagraphStyle(
        "small",
        parent=styles["body"],
        fontSize=7.5,
        leading=9.7,
        textColor=GRAPHITE,
    )
    styles["meta"] = ParagraphStyle(
        "meta",
        parent=styles["body"],
        fontName="InstrumentSans-Medium",
        fontSize=8.2,
        leading=12,
        textColor=GRAPHITE,
        alignment=TA_CENTER,
    )
    styles["h1"] = ParagraphStyle(
        "h1",
        parent=base["Heading1"],
        fontName="InstrumentSans-SemiBold",
        fontSize=16.2,
        leading=19,
        textColor=INK,
        spaceBefore=5 * mm,
        spaceAfter=3.2 * mm,
        keepWithNext=True,
    )
    styles["h1"].toc_level = 0
    styles["h2"] = ParagraphStyle(
        "h2",
        parent=base["Heading2"],
        fontName="InstrumentSans-SemiBold",
        fontSize=12.1,
        leading=14.5,
        textColor=INK,
        spaceBefore=4 * mm,
        spaceAfter=2.1 * mm,
        keepWithNext=True,
    )
    styles["h3"] = ParagraphStyle(
        "h3",
        parent=base["Heading3"],
        fontName="InstrumentSans-SemiBold",
        fontSize=9.6,
        leading=12,
        textColor=GRAPHITE,
        spaceBefore=2.8 * mm,
        spaceAfter=1.4 * mm,
        keepWithNext=True,
    )
    styles["quote"] = ParagraphStyle(
        "quote",
        parent=styles["body"],
        fontName="InstrumentSans-Medium",
        fontSize=9.1,
        leading=13,
        leftIndent=5 * mm,
        rightIndent=3 * mm,
        borderColor=MIST,
        borderWidth=0.8,
        borderPadding=(3 * mm, 3.5 * mm, 3 * mm, 4 * mm),
        backColor=SOFT,
        spaceBefore=2 * mm,
        spaceAfter=3.5 * mm,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        parent=styles["body"],
        leftIndent=4.5 * mm,
        firstLineIndent=0,
        bulletIndent=0.8 * mm,
        spaceAfter=1.1 * mm,
    )
    styles["number"] = ParagraphStyle(
        "number",
        parent=styles["body"],
        leftIndent=6 * mm,
        firstLineIndent=0,
        bulletIndent=0,
        spaceAfter=1.1 * mm,
    )
    styles["toc_title"] = ParagraphStyle(
        "toc_title",
        parent=styles["h1"],
        fontSize=19,
        leading=22,
        spaceBefore=0,
        spaceAfter=7 * mm,
    )
    styles["toc0"] = ParagraphStyle(
        "toc0",
        parent=styles["body"],
        fontName="InstrumentSans-Medium",
        fontSize=7.8,
        leading=9.6,
        leftIndent=0,
        firstLineIndent=0,
        textColor=INK,
        spaceBefore=0.35 * mm,
    )
    styles["toc1"] = ParagraphStyle(
        "toc1",
        parent=styles["small"],
        fontSize=7.7,
        leading=10.5,
        leftIndent=5 * mm,
        firstLineIndent=0,
        textColor=GRAPHITE,
    )
    return styles


def cover_story(document_type: str, subtitle: str, version: str, date: str, styles) -> list:
    return [
        Spacer(1, 30 * mm),
        Paragraph("ZENOVI", ParagraphStyle(
            "brand", fontName="InstrumentSans-SemiBold", fontSize=12, leading=14,
            textColor=GRAPHITE, alignment=TA_CENTER, tracking=2.2,
        )),
        Spacer(1, 28 * mm),
        Paragraph(document_type, ParagraphStyle(
            "cover_title", fontName="InstrumentSans-Bold", fontSize=36, leading=39,
            textColor=INK, alignment=TA_CENTER,
        )),
        Spacer(1, 5 * mm),
        Paragraph(subtitle, ParagraphStyle(
            "cover_subtitle", fontName="InstrumentSans-Medium", fontSize=13, leading=17,
            textColor=GRAPHITE, alignment=TA_CENTER,
        )),
        Spacer(1, 22 * mm),
        Table(
            [[Paragraph(f"VERSIÓN<br/><font name='InstrumentSans-SemiBold' color='#111113'>{version}</font>", styles["meta"]),
              Paragraph(f"FECHA<br/><font name='InstrumentSans-SemiBold' color='#111113'>{date}</font>", styles["meta"]),
              Paragraph("ESTADO<br/><font name='InstrumentSans-SemiBold' color='#111113'>Documento vivo</font>", styles["meta"])]],
            colWidths=[48 * mm, 48 * mm, 48 * mm],
            rowHeights=[21 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.6, MIST),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, MIST),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]),
        ),
        Spacer(1, 34 * mm),
        Paragraph("zenovi.app", ParagraphStyle(
            "domain", fontName="InstrumentSans-Medium", fontSize=9, leading=11,
            textColor=MUTED, alignment=TA_CENTER,
        )),
        PageBreak(),
    ]


def toc_story(styles) -> list:
    toc = TableOfContents()
    toc.levelStyles = [styles["toc0"], styles["toc1"]]
    return [Paragraph("Contenido", styles["toc_title"]), toc, PageBreak()]


def parse_table(lines: list[str], styles) -> Table:
    rows: list[list] = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell or "---") for cell in cells):
            continue
        rows.append([Paragraph(inline_markup(cell), styles["small"]) for cell in cells])
    columns = max(len(row) for row in rows)
    for row in rows:
        row.extend([Paragraph("", styles["small"])] * (columns - len(row)))
    widths = [170 * mm / columns] * columns
    table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SOFT),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 0), (-1, 0), "InstrumentSans-SemiBold"),
        ("GRID", (0, 0), (-1, -1), 0.45, MIST),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    return table


def markdown_story(path: Path, styles) -> list:
    raw_lines = path.read_text(encoding="utf-8").splitlines()
    story: list = []
    i = 0
    paragraph_buffer: list[str] = []
    list_buffer: list[tuple[str, str]] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_buffer
        if paragraph_buffer:
            text = " ".join(item.strip() for item in paragraph_buffer).strip()
            if text:
                story.append(Paragraph(inline_markup(text), styles["body"]))
            paragraph_buffer = []

    def flush_list() -> None:
        nonlocal list_buffer
        if not list_buffer:
            return
        ordered = list_buffer[0][0] == "number"
        for index, (_, text) in enumerate(list_buffer, start=1):
            story.append(Paragraph(
                inline_markup(text),
                styles["number" if ordered else "bullet"],
                bulletText=f"{index}." if ordered else "•",
            ))
        story.append(Spacer(1, 1.5 * mm))
        list_buffer = []

    while i < len(raw_lines):
        line = clean_text(raw_lines[i].rstrip())
        stripped = line.strip()

        if i == 0 and stripped.startswith("# "):
            i += 1
            continue
        if i < 8 and (stripped.startswith("Versión:") or stripped.startswith("Fecha:") or stripped.startswith("Propietarios:") or stripped.startswith("Dominio:") or stripped.startswith("Estado:") or stripped.startswith("Ventana objetivo:") or stripped.startswith("Audiencia:")):
            i += 1
            continue
        if not stripped:
            flush_paragraph()
            flush_list()
            i += 1
            continue
        if stripped.startswith("|") and i + 1 < len(raw_lines) and raw_lines[i + 1].strip().startswith("|"):
            flush_paragraph()
            flush_list()
            table_lines = []
            while i < len(raw_lines) and raw_lines[i].strip().startswith("|"):
                table_lines.append(clean_text(raw_lines[i]))
                i += 1
            story.append(parse_table(table_lines, styles))
            story.append(Spacer(1, 3 * mm))
            continue
        heading = re.match(r"^(#{2,4})\s+(.+)$", stripped)
        if heading:
            flush_paragraph()
            flush_list()
            level = len(heading.group(1))
            style = styles["h1"] if level == 2 else styles["h2"] if level == 3 else styles["h3"]
            story.append(Paragraph(inline_markup(heading.group(2)), style))
            i += 1
            continue
        if stripped.startswith(">"):
            flush_paragraph()
            flush_list()
            quote_lines = []
            while i < len(raw_lines) and raw_lines[i].strip().startswith(">"):
                quote_lines.append(raw_lines[i].strip().lstrip(">").strip())
                i += 1
            story.append(Paragraph(inline_markup(" ".join(quote_lines)), styles["quote"]))
            continue
        bullet = re.match(r"^-\s+(.+)$", stripped)
        number = re.match(r"^\d+\.\s+(.+)$", stripped)
        task = re.match(r"^-\s+\[([ xX!\-?])\]\s+(.+)$", stripped)
        if task:
            flush_paragraph()
            marker = task.group(1).lower()
            prefix = {"x": "[x]", " ": "[ ]", "-": "[-]", "!": "[!]", "?": "[?]"}.get(marker, "[ ]")
            list_buffer.append(("bullet", f"{prefix} {task.group(2)}"))
            i += 1
            continue
        if bullet:
            flush_paragraph()
            list_buffer.append(("bullet", bullet.group(1)))
            i += 1
            continue
        if number:
            flush_paragraph()
            if list_buffer and list_buffer[0][0] != "number":
                flush_list()
            list_buffer.append(("number", number.group(1)))
            i += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph()
            flush_list()
            i += 1
            code_lines = []
            while i < len(raw_lines) and not raw_lines[i].strip().startswith("```"):
                code_lines.append(clean_text(raw_lines[i]))
                i += 1
            i += 1
            story.append(Paragraph(html.escape("<br/>".join(code_lines)), styles["quote"]))
            continue
        paragraph_buffer.append(stripped)
        i += 1

    flush_paragraph()
    flush_list()
    return story


def build_pdf(source: Path, output: Path, doc_type: str, subtitle: str, version: str, date: str, compact: bool) -> None:
    styles = make_styles(compact=compact)
    doc = ZenoviDocTemplate(str(output), f"Zenovi - {doc_type}", version)
    story = cover_story(doc_type, subtitle, version, date, styles)
    story.extend(toc_story(styles))
    story.extend(markdown_story(source, styles))
    doc.multiBuild(story)


def main() -> None:
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_pdf(
        ROOT / "docs" / "PRD.md",
        OUTPUT_DIR / "zenovi-prd-v0.1.pdf",
        "PRODUCT REQUIREMENTS DOCUMENT",
        "Visión completa, requisitos e infraestructura",
        "0.1",
        "28 AGO 2026",
        compact=True,
    )
    build_pdf(
        ROOT / "docs" / "MVP-SPEC.md",
        OUTPUT_DIR / "zenovi-mvp-v0.1.pdf",
        "MVP",
        "Alcance, criterios de aceptación y plan de ejecución",
        "0.1",
        "28 AGO 2026",
        compact=False,
    )
    print(f"Generated PDFs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
