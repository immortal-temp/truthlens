import io
import html
import logging
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

logger = logging.getLogger(__name__)

def generate_pdf_report(doc: Dict[str, Any]) -> bytes:
    """
    Generates a structured, evidence-based verification PDF report using ReportLab
    with clickable hyperlinks on all retrieved evidence source articles.
    """
    buffer = io.BytesIO()
    doc_template = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b")
    )
    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    link_style = ParagraphStyle(
        'DocLink',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0284c7")
    )
    verdict_style = ParagraphStyle(
        'Verdict',
        parent=styles['Normal'],
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0284c7"),
        fontName="Helvetica-Bold"
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#94a3b8"),
        fontName="Helvetica-Oblique"
    )

    story = []

    # 1. Header
    story.append(Paragraph("TruthLens Verification Audit Report", title_style))
    created_ts = str(doc.get('created_at', 'N/A'))[:19]
    report_id = str(doc.get('id', 'N/A'))
    story.append(Paragraph(f"<b>Report ID:</b> {html.escape(report_id)} &nbsp;|&nbsp; <b>Generated:</b> {html.escape(created_ts)}", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # 2. Core Claim Summary Box
    claim_text = doc.get("claim", "")
    user_date = doc.get("input_date", "N/A")
    category = doc.get("category", "General")
    verdict = doc.get("verdict", "INSUFFICIENT_EVIDENCE")
    score = doc.get("evidence_score", 0.0)

    verdict_color = "#0284c7"
    if verdict == "LIKELY_TRUE":
        verdict_color = "#059669"
    elif verdict == "PARTIALLY_TRUE":
        verdict_color = "#0d9488"
    elif verdict == "MISLEADING":
        verdict_color = "#d97706"
    elif verdict == "LIKELY_FALSE":
        verdict_color = "#e11d48"

    claim_table_data = [
        [Paragraph("<b>Submitted Claim:</b>", body_style), Paragraph(html.escape(claim_text), body_style)],
        [Paragraph("<b>Event Date:</b>", body_style), Paragraph(html.escape(str(user_date)), body_style)],
        [Paragraph("<b>Category:</b>", body_style), Paragraph(html.escape(str(category)), body_style)],
        [Paragraph("<b>Assessed Verdict:</b>", body_style), Paragraph(f'<font color="{verdict_color}"><b>{html.escape(verdict)}</b></font>', verdict_style)],
        [Paragraph("<b>Evidence Score:</b>", body_style), Paragraph(f'<font color="{verdict_color}"><b>{score} / 100</b></font>', verdict_style)],
    ]
    t_claim = Table(claim_table_data, colWidths=[120, 420])
    t_claim.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_claim)
    story.append(Spacer(1, 10))

    # 3. Executive Summary
    ai_rep = doc.get("ai_report") or {}
    exec_summary = ai_rep.get("executive_summary", "No automated summary available.")
    story.append(Paragraph("Executive Summary", section_heading))
    story.append(Paragraph(html.escape(exec_summary), body_style))
    story.append(Spacer(1, 8))

    # 4. Evidence Score Breakdown
    sb = doc.get("score_breakdown") or {}
    story.append(Paragraph("Evidence Score Breakdown (0–100)", section_heading))
    score_table_data = [
        ["Evaluation Signal", "Weight", "Score Awarded"],
        ["Source Agreement", "25%", f"{sb.get('source_agreement', 0)} / 25"],
        ["Date Consistency", "15%", f"{sb.get('date_consistency', 0)} / 15"],
        ["Semantic Similarity", "20%", f"{sb.get('semantic_similarity', 0)} / 20"],
        ["Source Credibility Quality", "20%", f"{sb.get('source_quality', 0)} / 20"],
        ["Cross-Source Corroboration", "10%", f"{sb.get('cross_source_agreement', 0)} / 10"],
        ["Contradictory Fact-Check Penalty", "10%", f"{sb.get('contradictory_penalty', 0)} / 10"],
        ["Total Evidence Score", "100%", f"{score} / 100"]
    ]
    t_score = Table(score_table_data, colWidths=[240, 120, 180])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 10))

    # 5. Retrieved Evidence Sources Table with Clickable Links
    articles: List[Dict[str, Any]] = doc.get("articles", [])
    if articles:
        story.append(Paragraph(f"Retrieved Evidence Sources ({len(articles)} articles)", section_heading))
        art_rows = [["Source", "Article Title (Click to open)", "Published Date", "Classification"]]
        
        for a in articles:
            source_name = html.escape(str(a.get("source_name", "Unknown Publisher")))
            title = str(a.get("title", "Untitled Article")).strip()
            url = str(a.get("url", "")).strip()
            pub_date = str(a.get("published_at", "N/A"))[:10]
            classification = str(a.get("evidence_classification", "Neutral"))

            # Color code classification
            class_color = "#64748b"
            if classification == "Supporting":
                class_color = "#059669"
            elif classification == "Partially Supporting":
                class_color = "#0d9488"
            elif classification == "Contradicting":
                class_color = "#e11d48"
            elif classification == "Unrelated":
                class_color = "#94a3b8"

            # Create clickable link if URL exists
            if url and url.startswith("http"):
                clean_url = html.escape(url)
                clean_title = html.escape(title)
                title_cell = Paragraph(f'<a href="{clean_url}"><font color="#0284c7"><u>{clean_title}</u></font></a>', link_style)
            else:
                title_cell = Paragraph(html.escape(title), body_style)

            art_rows.append([
                Paragraph(f"<b>{source_name}</b>", body_style),
                title_cell,
                Paragraph(html.escape(pub_date), body_style),
                Paragraph(f'<font color="{class_color}"><b>{html.escape(classification)}</b></font>', body_style)
            ])

        t_art = Table(art_rows, colWidths=[100, 260, 80, 100])
        t_art.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t_art)
        story.append(Spacer(1, 10))

    # 6. Analysis Limitations & Legal Notice
    story.append(Paragraph("Analysis Limitations & Methodology", section_heading))
    limits = ai_rep.get("limitations", ["Analysis is grounded strictly in indexed news articles retrieved at the time of verification."])
    for lim in limits:
        story.append(Paragraph(f"• {html.escape(lim)}", body_style))
    story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
    story.append(Paragraph(
        "<b>Legal Notice:</b> This audit report provides an evidence-based assessment using publicly available "
        "journalistic and governmental sources indexed at the time of query. TruthLens analyzes empirical "
        "evidence and does not manufacture facts.",
        disclaimer_style
    ))

    doc_template.build(story)
    pdf_val = buffer.getvalue()
    buffer.close()
    return pdf_val
