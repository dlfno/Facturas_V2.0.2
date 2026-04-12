from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# ── Register Unicode font for icons ───────────────────────────────────────────
_font_paths = [
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
]
for _p in _font_paths:
    if os.path.exists(_p):
        pdfmetrics.registerFont(TTFont("IconFont", _p))
        break

def icon(char):
    """Wrap a unicode character in the icon font tag."""
    return f'<font name="IconFont">{char}</font>'

# ── Icon constants (pre-wrapped for use in Paragraphs) ─────────────────────────
I_CHECK    = icon("\u2713")
I_CROSS    = icon("\u2716")
I_UP       = icon("\u25B2")
I_DOWN     = icon("\u25BC")
I_RIGHT    = icon("\u25B6")
I_LEFT     = icon("\u25C0")
I_UNDO     = icon("\u21A9")
I_WARN     = icon("\u26A0")
I_CLOCK    = icon("\u23F0")
I_GEAR     = icon("\u2699")
I_SCALE    = icon("\u2696")
I_PENCIL   = icon("\u270E")
I_TRASH    = icon("\U0001F5D1")
I_TAG      = icon("\U0001F3F7")
I_SEARCH   = icon("\U0001F50D")
I_FOLDER   = icon("\U0001F4C2")
I_DOC      = icon("\U0001F4C4")
I_BUILDING = icon("\U0001F3E2")
I_UPLOAD   = icon("\u2B06")
I_DOWNLOAD = icon("\u2B07")
I_PLUS     = icon("\u2795")
I_REFRESH  = icon("\U0001F504")
I_CHECKBOX = icon("\u2610")
I_DASH     = icon("\u2B1C")

# ── Color palette ──────────────────────────────────────────────────────────────
NAVY      = colors.HexColor("#0D1B2A")
BLUE_MID  = colors.HexColor("#1A3A5C")
ACCENT    = colors.HexColor("#2A7AE4")
ACCENT_LT = colors.HexColor("#EBF3FF")
GRAY_DARK = colors.HexColor("#374151")
GRAY_MID  = colors.HexColor("#6B7280")
GRAY_LT   = colors.HexColor("#F3F4F6")
WHITE     = colors.white
GREEN     = colors.HexColor("#059669")
GREEN_LT  = colors.HexColor("#D1FAE5")
ORANGE    = colors.HexColor("#D97706")
ORANGE_LT = colors.HexColor("#FEF3C7")
RED       = colors.HexColor("#DC2626")
RED_LT    = colors.HexColor("#FEE2E2")
YELLOW    = colors.HexColor("#F59E0B")
TEAL      = colors.HexColor("#0D9488")
PURPLE    = colors.HexColor("#7C3AED")

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm

# ── Styles ─────────────────────────────────────────────────────────────────────
def make_styles():
    return {
        "cover_title": ParagraphStyle("cover_title",
            fontName="Helvetica-Bold", fontSize=32, textColor=WHITE,
            leading=38, spaceAfter=6),
        "cover_sub": ParagraphStyle("cover_sub",
            fontName="Helvetica", fontSize=13, textColor=colors.HexColor("#A8C4E8"),
            leading=18),
        "cover_label": ParagraphStyle("cover_label",
            fontName="Helvetica-Bold", fontSize=9, textColor=ACCENT,
            spaceAfter=4, tracking=2),
        "section_num": ParagraphStyle("section_num",
            fontName="Helvetica-Bold", fontSize=9, textColor=ACCENT,
            spaceAfter=0),
        "section_title": ParagraphStyle("section_title",
            fontName="Helvetica-Bold", fontSize=16, textColor=NAVY,
            spaceBefore=10, spaceAfter=6, leading=20),
        "h2": ParagraphStyle("h2",
            fontName="Helvetica-Bold", fontSize=11, textColor=NAVY,
            spaceBefore=10, spaceAfter=4, leading=15),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=9.5, textColor=GRAY_DARK,
            leading=15, spaceAfter=4),
        "body_small": ParagraphStyle("body_small",
            fontName="Helvetica", fontSize=8.5, textColor=GRAY_MID,
            leading=13),
        "note": ParagraphStyle("note",
            fontName="Helvetica-Oblique", fontSize=8.5, textColor=GRAY_MID,
            leading=13, leftIndent=10),
        "toc_item": ParagraphStyle("toc_item",
            fontName="Helvetica", fontSize=9.5, textColor=GRAY_DARK,
            leading=16, leftIndent=8),
        "toc_num": ParagraphStyle("toc_num",
            fontName="Helvetica-Bold", fontSize=9.5, textColor=ACCENT,
            leading=16),
        "table_header": ParagraphStyle("table_header",
            fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,
            leading=12, alignment=TA_LEFT),
        "table_cell": ParagraphStyle("table_cell",
            fontName="Helvetica", fontSize=8.5, textColor=GRAY_DARK,
            leading=12),
        "table_cell_bold": ParagraphStyle("table_cell_bold",
            fontName="Helvetica-Bold", fontSize=8.5, textColor=GRAY_DARK,
            leading=12),
        "kbd": ParagraphStyle("kbd",
            fontName="Courier-Bold", fontSize=8.5, textColor=NAVY,
            leading=12),
        "step_num": ParagraphStyle("step_num",
            fontName="Helvetica-Bold", fontSize=9, textColor=WHITE,
            alignment=TA_CENTER, leading=12),
        "step_text": ParagraphStyle("step_text",
            fontName="Helvetica", fontSize=9, textColor=GRAY_DARK,
            leading=13),
    }

S = make_styles()

# ── Helpers ────────────────────────────────────────────────────────────────────
def divider(color=ACCENT, thickness=0.8, space_before=6, space_after=6):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=space_after, spaceBefore=space_before)

def section_header(number, title):
    return KeepTogether([
        divider(ACCENT, 1.2, space_before=14, space_after=4),
        Paragraph(f"SECCI\u00d3N {number:02d}", S["section_num"]),
        Paragraph(title, S["section_title"]),
        divider(GRAY_LT, 0.4, space_before=0, space_after=8),
    ])

def info_box(text, color=ACCENT_LT, border=ACCENT):
    """Callout box."""
    tbl = Table([[Paragraph(text, S["body_small"])]], colWidths=[PAGE_W - 2*MARGIN])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,-1), color),
        ("LEFTPADDING",  (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING",   (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
        ("LINEAFTER",    (0,0), (0,-1), 3, border),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[color]),
    ]))
    return tbl

def data_table(headers, rows, col_widths, accent=ACCENT):
    """Styled data table."""
    header_row = [Paragraph(h, S["table_header"]) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), S["table_cell"]) for c in row])
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    row_colors = []
    for i in range(1, len(data)):
        bg = WHITE if i % 2 == 1 else GRAY_LT
        row_colors.append(("BACKGROUND", (0, i), (-1, i), bg))
    tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), accent),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, GRAY_LT]),
        ("LINEBELOW",    (0,0), (-1,-1), 0.3, colors.HexColor("#E5E7EB")),
        ("LINEBELOW",    (0,0), (-1,0), 0, WHITE),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ] + row_colors))
    return tbl

def steps_table(steps):
    """Numbered steps layout."""
    rows = []
    for i, (title, desc) in enumerate(steps, 1):
        num_cell = Table([[Paragraph(str(i), S["step_num"])]],
                         colWidths=[22], rowHeights=[22])
        num_cell.setStyle(TableStyle([
            ("BACKGROUND", (0,0),(-1,-1), ACCENT),
            ("VALIGN", (0,0),(-1,-1), "MIDDLE"),
            ("ALIGN", (0,0),(-1,-1), "CENTER"),
            ("TOPPADDING",(0,0),(-1,-1),0),
            ("BOTTOMPADDING",(0,0),(-1,-1),0),
        ]))
        text_block = [Paragraph(f"<b>{title}</b>", S["step_text"])]
        if desc:
            text_block.append(Paragraph(desc, S["body_small"]))
        rows.append([num_cell, text_block])
    tbl = Table(rows, colWidths=[30, PAGE_W - 2*MARGIN - 30])
    tbl.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("LEFTPADDING",  (1,0),(-1,-1), 10),
    ]))
    return tbl

def icon_ref_table(rows, avail):
    """Table showing icon - action - description."""
    header = [
        Paragraph("Icono", S["table_header"]),
        Paragraph("Acci\u00f3n", S["table_header"]),
        Paragraph("Descripci\u00f3n", S["table_header"]),
    ]
    data = [header]
    for icon, action, desc in rows:
        data.append([
            Paragraph(f"<b>{icon}</b>", ParagraphStyle("ic", fontName="IconFont",
                fontSize=12, textColor=GRAY_DARK, leading=14, alignment=TA_CENTER)),
            Paragraph(f"<b>{action}</b>", S["table_cell_bold"]),
            Paragraph(desc, S["table_cell"]),
        ])
    tbl = Table(data, colWidths=[avail*0.10, avail*0.28, avail*0.62], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), NAVY),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, GRAY_LT]),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW",    (0,0), (-1,-1), 0.3, colors.HexColor("#E5E7EB")),
    ]))
    return tbl

def badge(text, bg, fg=WHITE):
    t = Table([[Paragraph(f"<b>{text}</b>",
                ParagraphStyle("b", fontName="Helvetica-Bold", fontSize=7.5,
                               textColor=fg, leading=10, alignment=TA_CENTER))]],
              colWidths=[55], rowHeights=[16])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), bg),
        ("TOPPADDING",(0,0),(-1,-1),2),
        ("BOTTOMPADDING",(0,0),(-1,-1),2),
        ("LEFTPADDING",(0,0),(-1,-1),4),
        ("RIGHTPADDING",(0,0),(-1,-1),4),
    ]))
    return t

# ── Page templates ─────────────────────────────────────────────────────────────
def on_first_page(canvas_obj, doc):
    pass

def on_later_pages(canvas_obj, doc):
    w, h = A4
    canvas_obj.saveState()
    # Top bar
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, h - 18*mm, w, 18*mm, fill=1, stroke=0)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.rect(0, h - 18*mm, 4, 18*mm, fill=1, stroke=0)
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.drawString(MARGIN, h - 11*mm, "MANUAL DE USUARIO \u2014 SISTEMA DE COBRANZA")
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(colors.HexColor("#A8C4E8"))
    canvas_obj.drawRightString(w - MARGIN, h - 11*mm, "DLG  /  SMGS")
    # Bottom bar
    canvas_obj.setFillColor(GRAY_LT)
    canvas_obj.rect(0, 0, w, 12*mm, fill=1, stroke=0)
    canvas_obj.setStrokeColor(colors.HexColor("#E5E7EB"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(0, 12*mm, w, 12*mm)
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(GRAY_MID)
    canvas_obj.drawString(MARGIN, 4.5*mm, "Sistema de Cobranza \u2014 Uso interno")
    canvas_obj.drawRightString(w - MARGIN, 4.5*mm, f"P\u00e1gina {doc.page}")
    canvas_obj.restoreState()

# ── Cover page ─────────────────────────────────────────────────────────────────
def build_cover(canvas_obj, doc):
    w, h = A4
    canvas_obj.saveState()
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, w, h, fill=1, stroke=0)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.rect(0, 0, 6, h, fill=1, stroke=0)
    canvas_obj.setFillColor(BLUE_MID)
    canvas_obj.circle(w + 20, h * 0.72, 140, fill=1, stroke=0)
    canvas_obj.setFillColor(colors.HexColor("#0F2744"))
    canvas_obj.circle(w - 10, h * 0.72, 90, fill=1, stroke=0)
    canvas_obj.setStrokeColor(ACCENT)
    canvas_obj.setLineWidth(0.8)
    canvas_obj.line(MARGIN, h * 0.38, w - MARGIN, h * 0.38)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.roundRect(MARGIN, h * 0.87, 52, 18, 4, fill=1, stroke=0)
    canvas_obj.setFillColor(BLUE_MID)
    canvas_obj.roundRect(MARGIN + 60, h * 0.87, 60, 18, 4, fill=1, stroke=0)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.drawString(MARGIN + 14, h * 0.87 + 5, "DLG")
    canvas_obj.drawString(MARGIN + 74, h * 0.87 + 5, "SMGS")
    canvas_obj.setFont("Helvetica-Bold", 38)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.drawString(MARGIN, h * 0.62, "Manual de")
    canvas_obj.drawString(MARGIN, h * 0.62 - 44, "Usuario")
    canvas_obj.setFont("Helvetica", 14)
    canvas_obj.setFillColor(colors.HexColor("#A8C4E8"))
    canvas_obj.drawString(MARGIN, h * 0.62 - 72, "Sistema de Cobranza \u00b7 Gesti\u00f3n de Facturas CFDI")
    canvas_obj.setStrokeColor(ACCENT)
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(MARGIN, h * 0.38 - 10, MARGIN + 60, h * 0.38 - 10)
    labels = ["VERSI\u00d3N", "AUDIENCIA", "M\u00d3DULOS"]
    values = ["2.0", "Administradores", "13 secciones"]
    col_w = (w - 2 * MARGIN) / 3
    for i, (lbl, val) in enumerate(zip(labels, values)):
        x = MARGIN + i * col_w
        canvas_obj.setFont("Helvetica-Bold", 7.5)
        canvas_obj.setFillColor(ACCENT)
        canvas_obj.drawString(x, h * 0.18, lbl)
        canvas_obj.setFont("Helvetica", 11)
        canvas_obj.setFillColor(WHITE)
        canvas_obj.drawString(x, h * 0.18 - 16, val)
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(colors.HexColor("#4A6A8A"))
    canvas_obj.drawString(MARGIN, 18, "USO INTERNO \u2014 CONFIDENCIAL")
    canvas_obj.restoreState()

# ── TOC page ───────────────────────────────────────────────────────────────────
class CoverPage(Flowable):
    def draw(self): pass
    def wrap(self, *_): return (0, 0)

def toc_table():
    sections = [
        ("01", "Navegaci\u00f3n",                   "Barra lateral, colapso de men\u00fa, estructura"),
        ("02", "Dashboard",                   "KPIs, gr\u00e1ficas y tablas de alerta"),
        ("03", "Carga de Facturas (XML)",      "Cargar, detectar empresa, CFDI 3.3/4.0"),
        ("04", "Tabla de Facturas",            "Columnas, ordenamiento, paginaci\u00f3n, columna fija"),
        ("05", "Filtros y B\u00fasqueda",           "Filtros combinables, b\u00fasqueda en tiempo real"),
        ("06", "Edici\u00f3n de Campos",            "Proyecto, comentarios, fechas, estado, expandir texto"),
        ("07", "Flujo de Pagos",               "Marcar como pagado, revertir pago"),
        ("08", "Alertas y Estados",            "Sem\u00e1foro de estados, panel de alertas"),
        ("09", "Alias de Clientes",            "Asignar y administrar alias"),
        ("10", "Selecci\u00f3n Masiva y Eliminaci\u00f3n","Checkboxes, eliminar m\u00faltiples facturas"),
        ("11", "Exportar a Excel",             "Filtros, columnas y formato del .xlsx"),
        ("12", "Configuraci\u00f3n",                "RFCs por empresa, alias, reasignaci\u00f3n"),
        ("13", "Atajos de Teclado",            "Referencia r\u00e1pida de shortcuts"),
    ]
    rows = []
    for num, title, desc in sections:
        rows.append([
            Paragraph(f"<b>{num}</b>", ParagraphStyle("n", fontName="Helvetica-Bold",
                fontSize=9, textColor=ACCENT, leading=13, alignment=TA_CENTER)),
            Paragraph(f"<b>{title}</b>", ParagraphStyle("t", fontName="Helvetica-Bold",
                fontSize=9, textColor=NAVY, leading=13)),
            Paragraph(desc, ParagraphStyle("d", fontName="Helvetica",
                fontSize=8.5, textColor=GRAY_MID, leading=13)),
        ])
    avail = PAGE_W - 2*MARGIN
    tbl = Table(rows, colWidths=[26, avail*0.32, avail*0.60])
    tbl.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0),(-1,-1), 7),
        ("BOTTOMPADDING", (0,0),(-1,-1), 7),
        ("LEFTPADDING",   (0,0),(-1,-1), 6),
        ("RIGHTPADDING",  (0,0),(-1,-1), 6),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[WHITE, GRAY_LT]),
        ("LINEBELOW",     (0,0),(-1,-1), 0.3, colors.HexColor("#E5E7EB")),
    ]))
    return tbl

# ── Build story ────────────────────────────────────────────────────────────────
def build_story():
    story = []
    avail = PAGE_W - 2*MARGIN

    # ── TOC ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.0*cm))
    story.append(Paragraph("CONTENIDO", S["cover_label"]))
    story.append(Paragraph("Tabla de Contenidos", S["section_title"]))
    story.append(divider(GRAY_LT, 0.4, 0, 8))
    story.append(toc_table())
    story.append(PageBreak())

    # ────────────────────────────────────────────────────────────────────────
    # 1. NAVEGACIÓN
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(1, "Navegaci\u00f3n"))
    story.append(Paragraph(
        "El sistema cuenta con una <b>barra lateral izquierda</b> que centraliza el acceso a todas las secciones. "
        "Puede colapsarse haciendo clic en el bot\u00f3n de men\u00fa en la parte superior, mostrando solo iconos. "
        "Al pasar el cursor sobre un icono se despliega el nombre de la secci\u00f3n.", S["body"]))
    story.append(Spacer(1, 6))
    story.append(data_table(
        ["Icono", "Secci\u00f3n", "Descripci\u00f3n"],
        [
            [I_DASH,    "Dashboard",      "Vista general con m\u00e9tricas, gr\u00e1ficas y alertas"],
            [I_SCALE,   "DLG",            "Gesti\u00f3n de facturas de la empresa DLG"],
            [I_BUILDING,"SMGS",           "Gesti\u00f3n de facturas de la empresa SMGS"],
            [I_GEAR,    "Configuraci\u00f3n",  "Administraci\u00f3n de RFCs y alias de clientes"],
        ],
        [avail*0.10, avail*0.20, avail*0.70]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"Para <b>colapsar</b> la barra lateral, haz clic en el bot\u00f3n {I_LEFT} en la parte superior. "
        f"Para <b>expandirla</b>, haz clic en el bot\u00f3n {I_RIGHT}. Cuando est\u00e1 colapsada, "
        "solo se muestran los iconos y al pasar el cursor aparece un tooltip con el nombre.", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 2. DASHBOARD
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(2, "Dashboard"))
    story.append(Paragraph(
        "El Dashboard ofrece un resumen ejecutivo de la cobranza. En la parte superior derecha "
        "se puede alternar entre tres vistas: <b>Consolidado</b> (ambas empresas), <b>DLG</b> y <b>SMGS</b>.", S["body"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Indicadores Clave (KPIs)", S["h2"]))
    story.append(data_table(
        ["Icono", "Indicador", "Descripci\u00f3n"],
        [
            [I_DOWNLOAD,"Total Facturado",      "Suma de todos los totales (USD convertido a MXN)"],
            [I_CHECK,  "Total Cobrado",        "Suma de facturas marcadas como PAGADO"],
            [I_CLOCK,  "Pendiente de Cobro",   "Diferencia entre facturado y cobrado"],
            [I_DOC,    "Total Facturas",       "Cantidad total de facturas registradas"],
            [I_WARN,   "Sin Fecha Tentativa",  "Facturas sin fecha tentativa de pago asignada"],
            [I_WARN,   "Vencidas",             "Facturas cuya fecha tentativa ya pas\u00f3 sin cobrarse"],
        ],
        [avail*0.08, avail*0.25, avail*0.67]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Gr\u00e1ficas", S["h2"]))
    g_rows = [
        ["Distribuci\u00f3n por Estado",             "Gr\u00e1fica de dona \u2014 proporci\u00f3n de facturas por estado"],
        ["Facturaci\u00f3n Mensual",                  "Barras verticales \u2014 monto facturado por mes (\u00faltimos 12 meses)"],
        ["Top 10 Clientes por Monto Pendiente",  "Barras horizontales \u2014 clientes con mayor deuda pendiente"],
    ]
    story.append(data_table(["Gr\u00e1fica", "Descripci\u00f3n"], g_rows, [avail*0.38, avail*0.62]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Tablas de Alerta del Dashboard", S["h2"]))
    story.append(data_table(
        ["Tabla", "Detalle"],
        [
            ["Pr\u00f3ximas a Vencer",    "Facturas que vencen dentro de los pr\u00f3ximos 7 d\u00edas. Muestra: CFDI, Cliente, Total y fecha de vencimiento."],
            ["Sin Fecha de Pago",    "Facturas sin fecha tentativa. Se puede asignar la fecha directamente desde aqu\u00ed haciendo clic en \"Asignar fecha\", seleccionando la fecha y presionando OK."],
        ],
        [avail*0.25, avail*0.75]
    ))

    # ────────────────────────────────────────────────────────────────────────
    # 3. CARGA DE FACTURAS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(3, "Carga de Facturas (XML)"))
    story.append(Paragraph(
        "Desde las p\u00e1ginas de <b>DLG</b> o <b>SMGS</b>, haz clic en el bot\u00f3n <b>Cargar XML</b> "
        "(con icono \u25bc / \u25b2) para abrir o cerrar la zona de carga. "
        "Se soportan versiones <b>CFDI 3.3 y 4.0</b>.", S["body"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Formas de cargar archivos", S["h2"]))
    story.append(steps_table([
        ("Arrastrar y soltar", "Arrastra archivos XML directamente sobre la zona de carga. La zona se resalta en azul al arrastrar."),
        ("Seleccionar archivos", "Haz clic en el bot\u00f3n \u2b06 \"Seleccionar archivos\" para elegir uno o varios archivos XML."),
        ("Seleccionar carpeta", "Haz clic en el bot\u00f3n \U0001F4C2 \"Seleccionar carpeta\" para cargar todos los XML de una carpeta."),
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Proceso autom\u00e1tico", S["h2"]))
    story.append(Paragraph(
        "El sistema <b>detecta autom\u00e1ticamente</b> la empresa comparando el RFC del emisor con los RFCs configurados. "
        "Las facturas <b>duplicadas</b> (mismo UUID) se omiten. Al finalizar se muestra un resumen:", S["body"]))
    story.append(data_table(
        ["Resultado", "Indicador", "Significado"],
        [
            ["\u2713", "Facturas cargadas",   "N\u00famero de facturas procesadas exitosamente (texto verde)"],
            ["\u2014", "Duplicadas omitidas",  "Facturas con UUID ya existente que se saltaron"],
            ["\u2716", "Errores",              "Archivos con problemas (ej. RFC no registrado). Se muestra detalle por archivo (texto rojo)"],
        ],
        [avail*0.10, avail*0.28, avail*0.62]
    ))
    story.append(Spacer(1, 4))
    story.append(info_box(
        "\u26a0  Si aparece un error de RFC no registrado, ve a Configuraci\u00f3n (Secci\u00f3n 12) y agrega el RFC correspondiente."))

    # ────────────────────────────────────────────────────────────────────────
    # 4. TABLA DE FACTURAS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(4, "Tabla de Facturas"))
    story.append(Paragraph(
        "La tabla principal lista todas las facturas de la empresa seleccionada. La columna <b>CFDI</b> (junto con "
        "el checkbox de selecci\u00f3n) permanece <b>fija al desplazarse horizontalmente</b>. "
        "Las filas alternan entre blanco y gris para facilitar la lectura. "
        "Se muestran <b>50 facturas por p\u00e1gina</b>.", S["body"]))
    story.append(Spacer(1, 6))
    cols_data = [
        ["\u2610 CFDI",       "Serie + Folio de la factura. Columna fija con checkbox de selecci\u00f3n."],
        ["Folio Fiscal",   "UUID de la factura. Haz clic para copiar al portapapeles (muestra \"Copiado\" 1.5s)."],
        ["Fecha Emisi\u00f3n",  "Fecha de emisi\u00f3n en formato dd/mm/aaaa."],
        ["Cliente",        "Nombre del receptor. Muestra el alias si tiene uno asignado. Icono \U0001F3F7 para asignar alias."],
        ["Concepto",       "Descripci\u00f3n del servicio o producto (truncada, tooltip con texto completo)."],
        ["Proyecto",       "Campo editable \u2014 clic para editar. Icono \u25b6 para expandir texto largo."],
        ["Mon. / T.C.",    "Moneda (MXN o USD) y tipo de cambio (4 decimales)."],
        ["Subtotal / IVA / Total", "Montos de la factura con formato de moneda ($1,234.56)."],
        ["Fecha Tent.",    "Fecha tentativa de pago \u2014 clic para editar con selector de fecha."],
        ["Estado",         "Etiqueta de color con el estado actual \u2014 clic para cambiar."],
        ["Fecha Pago",     "Fecha de pago (verde). Si est\u00e1 PAGADO sin fecha, muestra enlace \"Asignar\"."],
        ["Comentarios",    "Notas adicionales \u2014 clic para editar. Icono \u25b6 para expandir texto largo."],
        ["Acciones",       "Botones: \u2713 marcar pagado, \u21a9 revertir pago, \U0001F5d1 eliminar."],
    ]
    story.append(data_table(["Columna", "Descripci\u00f3n"], cols_data, [avail*0.25, avail*0.75]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Iconos de la columna Acciones", S["h2"]))
    story.append(icon_ref_table([
        ("\u2713", "Marcar como pagado", "Bot\u00f3n verde. Abre modal para seleccionar fecha de pago. Solo visible si la factura no est\u00e1 pagada ni cancelada."),
        ("\u21a9", "Revertir pago", "Bot\u00f3n amarillo. Regresa la factura a Pendiente y elimina la fecha de pago. Solo visible si est\u00e1 PAGADO."),
        ("\U0001F5d1", "Eliminar factura", "Bot\u00f3n rojo. Elimina la factura tras confirmar en un modal. Acci\u00f3n permanente."),
    ], avail))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Ordenamiento y paginaci\u00f3n", S["h2"]))
    story.append(Paragraph(
        "Haz clic en el encabezado de cualquier columna ordenable para alternar entre orden ascendente (\u25b2) "
        "y descendente (\u25bc). En la parte inferior de la tabla se encuentran los botones de paginaci\u00f3n: "
        "<b>Anterior</b>, p\u00e1ginas num\u00e9ricas y <b>Siguiente</b>.", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 5. FILTROS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(5, "Filtros y B\u00fasqueda"))
    story.append(Paragraph(
        "La barra de filtros se encuentra encima de la tabla. Incluye un campo de b\u00fasqueda con icono "
        "\U0001F50D que filtra en <b>tiempo real</b> por: nombre de cliente o alias, RFC, concepto, proyecto, "
        "folio/serie y comentarios. Todos los filtros son combinables.", S["body"]))
    story.append(Spacer(1, 6))
    f_data = [
        ["Estado",                   "Todos \u00b7 Pendiente \u00b7 On Track \u00b7 Pr\u00f3ximo a Vencer \u00b7 Vencido \u00b7 Pagado \u00b7 Cancelada \u00b7 Sin Fecha"],
        ["Moneda",                   "Todas \u00b7 MXN \u00b7 USD"],
        ["Fecha emisi\u00f3n desde/hasta","Selector de fecha para rango de emisi\u00f3n"],
        ["Fecha tentativa desde/hasta","Selector de fecha para rango de fecha tentativa"],
        ["Cliente",                  "Lista desplegable con todos los clientes registrados (incluye alias)"],
    ]
    story.append(data_table(["Filtro", "Opciones disponibles"], f_data, [avail*0.33, avail*0.67]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Para restablecer todos los filtros, haz clic en el bot\u00f3n <b>\u2716 Limpiar</b> "
        "(solo aparece cuando hay alg\u00fan filtro activo).", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 6. EDICIÓN DE CAMPOS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(6, "Edici\u00f3n de Campos"))
    story.append(Paragraph(
        "Los siguientes campos se editan <b>directamente en la tabla</b> haciendo clic sobre ellos. "
        "No es necesario abrir otra pantalla.", S["body"]))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Proyecto y Comentarios", S["h2"]))
    story.append(steps_table([
        ("Hacer clic", "Clic sobre el texto (o donde dice \"Vac\u00edo\") para entrar en modo edici\u00f3n."),
        ("Escribir", "Se abre un \u00e1rea de texto (textarea) que permite escribir varias l\u00edneas y ver el contenido completo."),
        ("Guardar", "Presiona Ctrl+Enter (\u2318+Enter en Mac) para guardar."),
        ("Cancelar", "Presiona Escape para cancelar sin guardar cambios."),
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Expandir contenido largo", S["h2"]))
    story.append(Paragraph(
        "Cuando el texto de <b>Proyecto</b> o <b>Comentarios</b> es largo y aparece truncado, "
        "se muestra un peque\u00f1o icono <b>\u25b6</b> a la izquierda del texto. "
        "Haz clic en \u00e9l para expandir y ver el contenido completo (el icono cambia a <b>\u25bc</b>). "
        "Haz clic nuevamente para colapsar.", S["body"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Fecha Tentativa de Pago", S["h2"]))
    story.append(steps_table([
        ("Hacer clic", "Clic sobre la fecha (o \"Sin fecha\") para abrir el selector de fecha."),
        ("Seleccionar", "Elige la fecha deseada en el calendario."),
        ("Guardar", "Presiona Enter o haz clic fuera del campo para confirmar. Escape cancela."),
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Estado", S["h2"]))
    story.append(Paragraph(
        "Haz clic en la etiqueta de color del estado para abrir un selector desplegable. Las opciones son: "
        "<b>Pendiente</b>, <b>Pagado</b> y <b>Cancelada</b>. "
        "Si seleccionas <b>Pagado</b> se abrir\u00e1 autom\u00e1ticamente el modal de pago (ver Secci\u00f3n 7).", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 7. FLUJO DE PAGOS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(7, "Flujo de Pagos"))
    story.append(Paragraph("Marcar como Pagado", S["h2"]))
    story.append(Paragraph(
        "Existen dos formas equivalentes de registrar un pago:", S["body"]))
    story.append(steps_table([
        ("Bot\u00f3n de acci\u00f3n \u2713", "Clic en el icono verde de palomita en la columna Acciones."),
        ("Cambiar estado",  "Clic en la etiqueta de estado y seleccionar PAGADO en el desplegable."),
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "En ambos casos se abre un <b>modal</b> que muestra el CFDI y nombre del cliente. La fecha de pago "
        "se pre-llena con la fecha actual pero puede modificarse. Haz clic en <b>Confirmar pago</b> para guardar, "
        "o <b>Cancelar</b> para cerrar sin cambios. Tambi\u00e9n puedes presionar Enter para confirmar o Escape para cancelar.", S["body"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Revertir un Pago", S["h2"]))
    story.append(steps_table([
        ("Clic en icono \u21a9", "Icono amarillo de deshacer (flecha circular) en la columna Acciones. Solo visible en facturas con estado PAGADO."),
        ("Confirmar",              "Acepta en el modal de confirmaci\u00f3n que aparece."),
        ("Resultado",              "La factura regresa a estado Pendiente y se elimina la fecha de pago."),
    ]))

    # ────────────────────────────────────────────────────────────────────────
    # 8. ALERTAS Y ESTADOS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(8, "Alertas y Estados"))
    story.append(Paragraph(
        "El estado de cada factura se calcula <b>autom\u00e1ticamente</b> seg\u00fan sus fechas de emisi\u00f3n, "
        "fecha tentativa y si ha sido cobrada. Se muestra como una <b>etiqueta de color</b> con un punto indicador.", S["body"]))
    story.append(Spacer(1, 6))

    status_rows_raw = [
        ("PAGADO",            GREEN,  "Factura marcada como cobrada"),
        ("ON TRACK",          TEAL,   "Fecha tentativa a m\u00e1s de 7 d\u00edas"),
        ("PENDIENTE",         YELLOW, "Sin fecha tentativa, creada hace menos de 7 d\u00edas", colors.HexColor("#374151")),
        ("PR\u00d3XIMO A VENCER",  ORANGE, "Fecha tentativa dentro de los pr\u00f3ximos 7 d\u00edas"),
        ("VENCIDO",           RED,    "Fecha tentativa ya pas\u00f3 y no se ha cobrado"),
        ("SIN FECHA",         colors.HexColor("#7F1D1D"), "Sin fecha tentativa, creada hace m\u00e1s de 7 d\u00edas"),
        ("CANCELADA",         GRAY_MID,"Factura cancelada manualmente"),
    ]
    s_rows = []
    for item in status_rows_raw:
        txt, bg = item[0], item[1]
        desc = item[2]
        fg = item[3] if len(item) > 3 else WHITE
        badge_tbl = Table([[Paragraph(f"<b>{txt}</b>",
                            ParagraphStyle("bs", fontName="Helvetica-Bold", fontSize=7.5,
                                           textColor=fg, leading=10, alignment=TA_CENTER))]],
                          colWidths=[100], rowHeights=[16])
        badge_tbl.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,-1), bg),
            ("TOPPADDING",(0,0),(-1,-1),2), ("BOTTOMPADDING",(0,0),(-1,-1),2),
            ("LEFTPADDING",(0,0),(-1,-1),6), ("RIGHTPADDING",(0,0),(-1,-1),6),
        ]))
        s_rows.append([badge_tbl, Paragraph(desc, S["table_cell"])])

    st = Table(s_rows, colWidths=[110, avail - 110])
    st.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
        ("LEFTPADDING",(0,0),(-1,-1),6), ("RIGHTPADDING",(0,0),(-1,-1),6),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[WHITE, GRAY_LT]),
        ("LINEBELOW",(0,0),(-1,-1),0.3,colors.HexColor("#E5E7EB")),
    ]))
    story.append(st)
    story.append(Spacer(1, 10))
    story.append(Paragraph("Panel de Alertas", S["h2"]))
    story.append(Paragraph(
        "En las p\u00e1ginas de empresa (DLG / SMGS) se muestra un panel con tres secciones. "
        "Cada secci\u00f3n se puede <b>expandir o colapsar</b> haciendo clic sobre ella.", S["body"]))
    story.append(Spacer(1, 4))
    story.append(data_table(
        ["Icono", "Secci\u00f3n", "Contenido"],
        [
            ["\u26a0",  "Sin Fecha Tentativa",  "Facturas sin fecha tentativa con m\u00e1s de 7 d\u00edas (icono rojo)"],
            ["\u23f0", "Pr\u00f3ximas a Vencer",    "Facturas que vencen en los pr\u00f3ximos 7 d\u00edas (icono naranja)"],
            ["\u26a0",  "Vencidas",             "Facturas cuya fecha tentativa ya pas\u00f3 (icono rojo)"],
        ],
        [avail*0.08, avail*0.27, avail*0.65]
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Cada elemento muestra: folio, nombre del cliente, monto y fecha de vencimiento.", S["body_small"]))

    # ────────────────────────────────────────────────────────────────────────
    # 9. ALIAS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(9, "Alias de Clientes"))
    story.append(Paragraph(
        "Los alias reemplazan los nombres largos del XML con nombres cortos y legibles. "
        "Se aplican <b>autom\u00e1ticamente a todas las facturas</b> del mismo RFC receptor, incluidas las futuras.", S["body"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Asignar alias desde la tabla de facturas", S["h2"]))
    story.append(steps_table([
        ("Icono de etiqueta \U0001F3F7", "En la columna Cliente, haz clic en el icono de etiqueta (peque\u00f1o, junto al nombre)."),
        ("Escribir alias",    "En el modal se muestra el RFC y nombre original. Escribe el alias deseado (ej. \"Citibanamex\")."),
        ("Guardar",           "Clic en Guardar. El alias se aplica inmediatamente a todas las facturas de ese RFC."),
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Administrar alias desde Configuraci\u00f3n", S["h2"]))
    story.append(Paragraph(
        "Navega a <b>Configuraci\u00f3n</b> > secci\u00f3n <b>Alias de Clientes</b>. Se muestra una tabla con todos los alias:", S["body"]))
    story.append(Spacer(1, 4))
    story.append(icon_ref_table([
        ("\u270e", "Editar alias", "Abre el campo de edici\u00f3n inline. Enter para guardar, Escape para cancelar."),
        ("\u2713", "Guardar edici\u00f3n", "Bot\u00f3n verde que confirma los cambios del alias editado."),
        ("\u2716", "Cancelar edici\u00f3n", "Bot\u00f3n gris que descarta los cambios."),
        ("\U0001F5d1", "Eliminar alias", "Bot\u00f3n rojo que elimina el alias tras confirmar."),
    ], avail))
    story.append(Spacer(1, 4))
    story.append(info_box(
        "Tambi\u00e9n puedes asignar alias directamente desde la tabla de facturas con el icono de etiqueta \U0001F3F7 "
        "en la columna Cliente."))

    # ────────────────────────────────────────────────────────────────────────
    # 10. SELECCIÓN MASIVA
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(10, "Selecci\u00f3n Masiva y Eliminaci\u00f3n"))
    story.append(Paragraph("Seleccionar facturas", S["h2"]))
    story.append(data_table(
        ["Acci\u00f3n", "Descripci\u00f3n"],
        [
            ["Checkbox por fila",      "Selecciona facturas individuales usando el checkbox junto al CFDI"],
            ["Checkbox del encabezado", "Selecciona o deselecciona todas las facturas de la p\u00e1gina actual"],
        ],
        [avail*0.35, avail*0.65]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Eliminar seleccionadas", S["h2"]))
    story.append(steps_table([
        ("Seleccionar",    "Marca una o m\u00e1s facturas con sus checkboxes."),
        ("Barra azul",     "Aparece una barra indicando cu\u00e1ntas facturas est\u00e1n seleccionadas, con bot\u00f3n \"Deseleccionar\"."),
        ("Eliminar",       "Clic en el bot\u00f3n rojo \U0001F5d1 \"Eliminar seleccionadas\"."),
        ("Confirmar",      "Acepta en el modal de confirmaci\u00f3n."),
    ]))
    story.append(Spacer(1, 6))
    story.append(info_box(
        "\u26a0  La eliminaci\u00f3n es permanente y no puede deshacerse. "
        "Para eliminar una sola factura, usa el icono rojo \U0001F5d1 en la columna Acciones.",
        color=ORANGE_LT, border=ORANGE))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Eliminar una factura individual", S["h2"]))
    story.append(Paragraph(
        "Haz clic en el icono rojo \U0001F5d1 en la columna <b>Acciones</b> de la fila correspondiente. "
        "Se mostrar\u00e1 un modal de confirmaci\u00f3n antes de eliminar.", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 11. EXPORTAR EXCEL
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(11, "Exportar a Excel"))
    story.append(Paragraph(
        "Desde las p\u00e1ginas de empresa (DLG / SMGS), haz clic en el bot\u00f3n verde "
        "\u2b07 <b>Exportar a Excel</b>. "
        "Se descargar\u00e1 un archivo <b>.xlsx</b> con nombre <b>Cobranza_{Empresa}_{Fecha}.xlsx</b>.", S["body"]))
    story.append(Spacer(1, 6))
    story.append(data_table(
        ["Caracter\u00edstica", "Detalle"],
        [
            ["Registros incluidos",  "Solo las facturas que coinciden con los filtros activos al momento de exportar"],
            ["Columnas",             "CFDI, Folio Fiscal, Fecha Emisi\u00f3n, RFC, Cliente, Concepto, Proyecto, Moneda, T.C., Subtotal, IVA, IVA Retenido, Total, Fecha Tent. Pago, Estado, Fecha Pago, Comentarios"],
            ["Colores de estado",    "El texto de la columna Estado se colorea: verde (Pagado), rojo (Vencido), naranja (Pr\u00f3ximo/Pendiente), gris (Cancelada)"],
            ["Fila de totales",      "Al final del archivo se incluye una fila con la suma de Subtotal, IVA, IVA Retenido y Total"],
            ["Auto-filtro",          "Habilitado en todas las columnas para poder filtrar y ordenar directamente en Excel"],
        ],
        [avail*0.25, avail*0.75]
    ))

    # ────────────────────────────────────────────────────────────────────────
    # 12. CONFIGURACIÓN
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(12, "Configuraci\u00f3n"))
    story.append(Paragraph("RFCs por Empresa", S["h2"]))
    story.append(Paragraph(
        "Mapea los RFCs de emisor a cada empresa para que el sistema detecte autom\u00e1ticamente "
        "a qu\u00e9 empresa pertenece cada factura al cargar XMLs.", S["body"]))
    story.append(Spacer(1, 6))
    story.append(steps_table([
        ("Agregar RFC", "Escribe el RFC en el campo de texto, selecciona la empresa (DLG/SMGS) y clic en el bot\u00f3n \u2795 Agregar."),
        ("Reasignar facturas", "Si modificas RFCs despu\u00e9s de cargar facturas, haz clic en el bot\u00f3n \U0001F504 \"Reasignar facturas\" para actualizar la asignaci\u00f3n de todas las facturas existentes."),
        ("Eliminar RFC", "Clic en el icono rojo \U0001F5d1 junto al RFC que deseas eliminar."),
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Iconos en la pantalla de Configuraci\u00f3n", S["h2"]))
    story.append(icon_ref_table([
        ("\u2795", "Agregar", "Agrega un nuevo RFC a la lista de la empresa seleccionada."),
        ("\U0001F504", "Reasignar facturas", "Re-escanea todas las facturas y actualiza su empresa seg\u00fan los RFCs configurados."),
        ("\U0001F5d1", "Eliminar", "Elimina un RFC o alias de la lista."),
        ("\u270e", "Editar", "Abre la edici\u00f3n inline de un alias existente."),
    ], avail))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Alias de Clientes", S["h2"]))
    story.append(Paragraph("Ver Secci\u00f3n 9 \u2014 Alias de Clientes.", S["body"]))

    # ────────────────────────────────────────────────────────────────────────
    # 13. ATAJOS
    # ────────────────────────────────────────────────────────────────────────
    story.append(section_header(13, "Atajos de Teclado"))
    story.append(Paragraph(
        "Referencia r\u00e1pida de atajos para agilizar el trabajo en el sistema.", S["body"]))
    story.append(Spacer(1, 6))

    kbd_style = ParagraphStyle("kbd2", fontName="Courier-Bold", fontSize=8.5,
                                textColor=NAVY, leading=12,
                                backColor=colors.HexColor("#EEF2FF"))
    kbd_rows = [
        ["Ctrl+Enter / \u2318+Enter", "Guardar cambios",  "Edici\u00f3n de Proyecto o Comentarios"],
        ["Enter",                "Guardar cambios",  "Edici\u00f3n de fecha, campos en Configuraci\u00f3n"],
        ["Escape",               "Cancelar edici\u00f3n", "Cualquier campo en edici\u00f3n o modal abierto"],
        ["Clic en UUID",         "Copiar al portapapeles", "Columna Folio Fiscal en la tabla"],
    ]
    tbl_data = [[Paragraph(r[0], kbd_style),
                 Paragraph(r[1], S["table_cell"]),
                 Paragraph(r[2], S["body_small"])] for r in kbd_rows]
    ktbl = Table([[Paragraph("Atajo", S["table_header"]),
                   Paragraph("Acci\u00f3n", S["table_header"]),
                   Paragraph("Contexto", S["table_header"])]] + tbl_data,
                 colWidths=[avail*0.33, avail*0.30, avail*0.37], repeatRows=1)
    ktbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), NAVY),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, GRAY_LT]),
        ("TOPPADDING",   (0,0),(-1,-1), 7),
        ("BOTTOMPADDING",(0,0),(-1,-1), 7),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
        ("RIGHTPADDING", (0,0),(-1,-1), 8),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("LINEBELOW",    (0,0), (-1,-1), 0.3, colors.HexColor("#E5E7EB")),
    ]))
    story.append(ktbl)

    return story

# ── Main ───────────────────────────────────────────────────────────────────────
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Manual_Sistema_Cobranza.pdf")

doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN + 10*mm, bottomMargin=MARGIN + 10*mm,
    title="Manual de Usuario \u2014 Sistema de Cobranza",
    author="Sistema de Cobranza DLG / SMGS",
)

def build(canvas_obj, doc):
    if doc.page == 1:
        build_cover(canvas_obj, doc)
    else:
        on_later_pages(canvas_obj, doc)

story = build_story()

from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate

frames_cover = [Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0,
                       topPadding=0, bottomPadding=0, id="cover")]
frames_inner = [Frame(MARGIN, MARGIN + 10*mm, PAGE_W - 2*MARGIN,
                       PAGE_H - 2*MARGIN - 20*mm, id="inner")]

class MyDoc(BaseDocTemplate):
    def build(self, story, **kw):
        super().build(story, **kw)

doc2 = MyDoc(OUTPUT, pagesize=A4,
             leftMargin=MARGIN, rightMargin=MARGIN,
             topMargin=MARGIN + 10*mm, bottomMargin=MARGIN + 10*mm)

cover_tpl   = PageTemplate(id="Cover", frames=frames_cover,   onPage=build_cover)
content_tpl = PageTemplate(id="Content", frames=frames_inner, onPage=on_later_pages)
doc2.addPageTemplates([cover_tpl, content_tpl])

from reportlab.platypus import NextPageTemplate
full_story = [NextPageTemplate("Content"), PageBreak()] + build_story()
doc2.build(full_story)

print("PDF generado:", OUTPUT)
