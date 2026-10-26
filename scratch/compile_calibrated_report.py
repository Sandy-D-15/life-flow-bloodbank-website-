import os
import re
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION, WD_ORIENTATION
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from PIL import Image

from report_docx_builder import (
    set_cell_background,
    set_cell_margins,
    set_table_borders,
    make_header_repeat,
    prevent_row_split,
    add_callout,
    add_code_block
)

def set_section_page_numbering(section, start=1, num_format='decimal'):
    sectPr = section._sectPr
    for child in list(sectPr):
        if child.tag.endswith('pgNumType'):
            sectPr.remove(child)
    pgNumType = parse_xml(f'<w:pgNumType {nsdecls("w")} w:start="{start}" w:fmt="{num_format}"/>')
    sectPr.append(pgNumType)

def add_centered_page_number(footer):
    p = footer.paragraphs[0]
    p.text = ""
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    fldSimple = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
    p._p.append(fldSimple)

def add_right_header(header, text="LifeFlow Blood Bank Management System"):
    p = header.paragraphs[0]
    p.text = ""
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(8.5)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

def format_bold_italic_tokens(paragraph, text, font_size=Pt(11.5), font_name="Times New Roman"):
    tokens = re.split(r'(\*\*.*?\*\*|`.*?`|\$.*?\$)', text)
    for token in tokens:
        if not token:
            continue
        if token.startswith('**') and token.endswith('**'):
            r = paragraph.add_run(token[2:-2])
            r.font.name = font_name
            r.font.bold = True
            r.font.size = font_size
            r.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        elif token.startswith('`') and token.endswith('`'):
            r = paragraph.add_run(token[1:-1])
            r.font.name = "Courier New"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x99, 0x1B, 0x1B)
        elif token.startswith('$') and token.endswith('$'):
            r = paragraph.add_run(token[1:-1])
            r.font.name = font_name
            r.font.italic = True
            r.font.size = font_size
        else:
            r = paragraph.add_run(token)
            r.font.name = font_name
            r.font.size = font_size
            r.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

def build_calibrated_docx(page_map=None):
    print("--- Building LifeFlow Master Project Report (Calibrated) ---")
    doc = Document()

    # Section 0: Cover Page (Unnumbered, No Header/Footer)
    s0 = doc.sections[0]
    s0.page_width = Inches(8.5)
    s0.page_height = Inches(11.0)
    s0.top_margin = Inches(1.0)
    s0.bottom_margin = Inches(1.0)
    s0.left_margin = Inches(1.25)
    s0.right_margin = Inches(1.0)
    s0.different_first_page_header_footer = False

    # Normal Style configuration
    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(11.5)
    normal.paragraph_format.line_spacing = 1.35
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.space_after = Pt(4.5)

    # ==========================================================
    # 1. COVER PAGE (EXACT SINGLE PAGE FIT)
    # ==========================================================
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_uni.paragraph_format.space_before = Pt(24)
    p_uni.paragraph_format.space_after = Pt(8)
    r_uni = p_uni.add_run("UNIVERSITY OF MUMBAI")
    r_uni.font.size = Pt(18)
    r_uni.font.bold = True
    r_uni.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(8)
    p_proj.paragraph_format.space_after = Pt(8)
    r_proj = p_proj.add_run("A Project Report on")
    r_proj.font.size = Pt(13)
    r_proj.font.italic = True
    r_proj.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(12)
    r_title = p_title.add_run("LIFEFLOW BLOOD BANK MANAGEMENT SYSTEM")
    r_title.font.size = Pt(21)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    p_deg = doc.add_paragraph()
    p_deg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_deg.paragraph_format.space_before = Pt(10)
    p_deg.paragraph_format.space_after = Pt(4)
    r_deg1 = p_deg.add_run("Submitted in partial fulfillment of the requirements for the degree of\n")
    r_deg1.font.size = Pt(11.5)
    r_deg1.font.italic = True
    r_deg2 = p_deg.add_run("BACHELOR OF SCIENCE (COMPUTER SCIENCE)\n")
    r_deg2.font.size = Pt(14)
    r_deg2.font.bold = True
    r_deg3 = p_deg.add_run("Semester – V  •  Academic Year: 2026–2027")
    r_deg3.font.size = Pt(11.5)
    r_deg3.font.bold = True

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(20)
    p_sub.paragraph_format.space_after = Pt(12)
    r_sub1 = p_sub.add_run("Submitted By:\n")
    r_sub1.font.size = Pt(11.5)
    r_sub1.font.italic = True
    r_sub2 = p_sub.add_run("[[STUDENT NAME]]\n")
    r_sub2.font.size = Pt(13)
    r_sub2.font.bold = True
    r_sub3 = p_sub.add_run("(Roll No. / Seat No.: [[ROLL NO]])")
    r_sub3.font.size = Pt(11.5)

    p_guid = doc.add_paragraph()
    p_guid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guid.paragraph_format.space_before = Pt(14)
    p_guid.paragraph_format.space_after = Pt(16)
    r_guid1 = p_guid.add_run("Under the Esteemed Guidance of:\n")
    r_guid1.font.size = Pt(11.5)
    r_guid1.font.italic = True
    r_guid2 = p_guid.add_run("[[GUIDE NAME]]\n")
    r_guid2.font.size = Pt(13)
    r_guid2.font.bold = True
    r_guid3 = p_guid.add_run("[[DESIGNATION]]")
    r_guid3.font.size = Pt(11.5)

    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(16)
    p_col.paragraph_format.space_after = Pt(0)
    r_col1 = p_col.add_run("DEPARTMENT OF COMPUTER SCIENCE\n")
    r_col1.font.size = Pt(12.5)
    r_col1.font.bold = True
    r_col2 = p_col.add_run("Jan Seva Sangh's Shri Ram College Of Commerce\n")
    r_col2.font.size = Pt(13.5)
    r_col2.font.bold = True
    r_col2.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)
    r_col3 = p_col.add_run("(Affiliated to the University Of Mumbai)\nNAAC ACCREDITED 'B' GRADE (FIRST CYCLE)\n[[COLLEGE ADDRESS]]")
    r_col3.font.size = Pt(10.5)
    r_col3.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ==========================================================
    # SECTION 1: FRONT MATTER (ROMAN NUMERALS STARTING AT ii)
    # ==========================================================
    s1 = doc.add_section(WD_SECTION.NEW_PAGE)
    s1.page_width = Inches(8.5)
    s1.page_height = Inches(11.0)
    s1.top_margin = Inches(1.0)
    s1.bottom_margin = Inches(1.0)
    s1.left_margin = Inches(1.25)
    s1.right_margin = Inches(1.0)
    s1.different_first_page_header_footer = False
    s1.header.is_linked_to_previous = False
    s1.footer.is_linked_to_previous = False

    set_section_page_numbering(s1, start=2, num_format='lowerRoman')
    add_centered_page_number(s1.footer)

    # ----------------- 2. CERTIFICATE (PAGE ii) -----------------
    p_c_head = doc.add_paragraph()
    p_c_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c_head.paragraph_format.space_before = Pt(8)
    p_c_head.paragraph_format.space_after = Pt(4)
    r_c1 = p_c_head.add_run("CERTIFICATE\n")
    r_c1.font.size = Pt(20)
    r_c1.font.bold = True
    r_c1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    r_c2 = p_c_head.add_run("Jan Seva Sangh's\n")
    r_c2.font.size = Pt(12)
    r_c3 = p_c_head.add_run("Shri Ram College Of Commerce\n")
    r_c3.font.size = Pt(15)
    r_c3.font.bold = True
    r_c3.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)
    r_c4 = p_c_head.add_run("(Affiliated to the University Of Mumbai)\nNAAC ACCREDITED 'B' GRADE (FIRST CYCLE)")
    r_c4.font.size = Pt(10.5)
    r_c4.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(10)
    p_meta.paragraph_format.space_after = Pt(12)
    r_m = p_meta.add_run("CLASS: TYBSc (CS)     •     SUBJECT: Project Implementation     •     SEAT NO / ROLL NO: [[ROLL NO]]")
    r_m.font.size = Pt(10)
    r_m.font.bold = True

    p_cert_body = doc.add_paragraph()
    p_cert_body.paragraph_format.space_before = Pt(8)
    p_cert_body.paragraph_format.space_after = Pt(10)
    p_cert_body.paragraph_format.line_spacing = 1.35
    r_cb1 = p_cert_body.add_run("This is to certify that the project report entitled ")
    r_cb2 = p_cert_body.add_run('"LIFEFLOW BLOOD BANK MANAGEMENT SYSTEM" ')
    r_cb2.font.bold = True
    r_cb3 = p_cert_body.add_run("is a bonafide work carried out by ")
    r_cb4 = p_cert_body.add_run("Mr. / Miss [[STUDENT NAME]] ")
    r_cb4.font.bold = True
    r_cb5 = p_cert_body.add_run(
        "for the practical examination of Bachelor of Science in Computer Science (B.Sc. CS), "
        "Semester – V of the academic year 2026–2027 in this college.\n\n"
        "The candidate has successfully completed the project work under the guidance and supervision "
        "of the departmental faculty in accordance with the curriculum prescribed by the University of Mumbai."
    )

    sig_table = doc.add_table(rows=3, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False
    sig_table.columns[0].width = Inches(3.1)
    sig_table.columns[1].width = Inches(3.1)

    sig_table.cell(0, 0).paragraphs[0].text = "\n_____________________________\nInternal Examiner"
    sig_table.cell(0, 1).paragraphs[0].text = "\n_____________________________\nExternal Examiner"
    sig_table.cell(0, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    sig_table.cell(1, 0).paragraphs[0].text = "\nDate: _________________________"
    sig_table.cell(1, 1).paragraphs[0].text = "\nCollege Stamp / Seal"
    sig_table.cell(1, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    sig_table.cell(2, 0).paragraphs[0].text = "\n_____________________________\nHead of Department (CS)"
    sig_table.cell(2, 1).paragraphs[0].text = "\n_____________________________\nPrincipal"
    sig_table.cell(2, 1).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    for row in sig_table.rows:
        for cell in row.cells:
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(10)
            cell.paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # ----------------- 3. ABSTRACT (PAGE iii) -----------------
    p_abs_h = doc.add_paragraph()
    p_abs_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs_h.paragraph_format.space_before = Pt(8)
    p_abs_h.paragraph_format.space_after = Pt(12)
    r_ah = p_abs_h.add_run("ABSTRACT")
    r_ah.font.size = Pt(16)
    r_ah.font.bold = True
    r_ah.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    with open('output/chapters/00_front_matter.md', 'r', encoding='utf-8') as f:
        fm_content = f.read()

    abs_match = re.search(r'# ABSTRACT\s*\n\n(.*?)(?=\n\n---\n\n<!-- PAGE BREAK: ACKNOWLEDGEMENT)', fm_content, re.DOTALL)
    if abs_match:
        for para in abs_match.group(1).strip().split('\n\n'):
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.25
            p.paragraph_format.space_after = Pt(6)
            format_bold_italic_tokens(p, para.strip(), font_size=Pt(11))

    doc.add_page_break()

    # ----------------- 4. ACKNOWLEDGEMENT (PAGE iv) -----------------
    p_ack_h = doc.add_paragraph()
    p_ack_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack_h.paragraph_format.space_before = Pt(8)
    p_ack_h.paragraph_format.space_after = Pt(12)
    r_ack = p_ack_h.add_run("ACKNOWLEDGEMENT")
    r_ack.font.size = Pt(16)
    r_ack.font.bold = True
    r_ack.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    ack_match = re.search(r'# ACKNOWLEDGEMENT\s*\n\n(.*?)(?=\n\n\\vspace\{1\.5cm\}|\n\n<div align="right">)', fm_content, re.DOTALL)
    if ack_match:
        for para in ack_match.group(1).strip().split('\n\n'):
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.22
            p.paragraph_format.space_after = Pt(5)
            format_bold_italic_tokens(p, para.strip(), font_size=Pt(10.5))

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(10)
    p_sig.paragraph_format.space_after = Pt(0)
    r_s = p_sig.add_run("[[STUDENT NAME]]\nTYBSc (Computer Science) – Semester V\nRoll No.: [[ROLL NO]]\nAcademic Year: 2026–2027\nJan Seva Sangh's Shri Ram College Of Commerce")
    r_s.font.bold = True
    r_s.font.size = Pt(10)

    doc.add_page_break()

    # ----------------- 5. TABLE OF CONTENTS (PAGES v - vii) -----------------
    p_toc_h = doc.add_paragraph()
    p_toc_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_h.paragraph_format.space_before = Pt(8)
    p_toc_h.paragraph_format.space_after = Pt(12)
    r_toc = p_toc_h.add_run("TABLE OF CONTENTS")
    r_toc.font.size = Pt(16)
    r_toc.font.bold = True
    r_toc.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    toc_match = re.search(r'# TABLE OF CONTENTS\s*\n\n\| Sr\. No\..*?\n\|:?---.*?\n(.*?)(?=\n\n---\n\n<!-- PAGE BREAK: LIST OF TABLES -->)', fm_content, re.DOTALL)
    if toc_match:
        toc_lines = toc_match.group(1).strip().split('\n')
        toc_table = doc.add_table(rows=1, cols=3)
        toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        toc_table.autofit = False
        toc_table.columns[0].width = Inches(0.9)
        toc_table.columns[1].width = Inches(4.5)
        toc_table.columns[2].width = Inches(0.85)

        hdr = toc_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        hdr.cells[0].paragraphs[0].text = "Sr. No."
        hdr.cells[1].paragraphs[0].text = "Chapter / Section Title"
        hdr.cells[2].paragraphs[0].text = "Page"
        for cell in hdr.cells:
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.runs[0].font.name = "Times New Roman"
            p.runs[0].font.size = Pt(9.5)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        hdr.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

        for line in toc_lines:
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 3:
                row = toc_table.add_row()
                row.cells[0].width = Inches(0.9)
                row.cells[1].width = Inches(4.5)
                row.cells[2].width = Inches(0.85)

                sr_text = parts[0].replace('**', '').strip()
                title_text = parts[1].replace('**', '').replace('&emsp;', '    ').strip()
                page_text = parts[2].replace('**', '').strip()

                # If page_map provided, look up exact page
                if page_map:
                    # check lookup keys: sr_text, or title_text
                    key = sr_text if sr_text else title_text.strip()
                    if key in page_map:
                        page_text = str(page_map[key])
                    elif title_text.strip() in page_map:
                        page_text = str(page_map[title_text.strip()])

                is_chapter = 'CHAPTER' in title_text or (parts[0].isdigit() and not '.' in parts[0])

                row.cells[0].paragraphs[0].text = sr_text
                row.cells[1].paragraphs[0].text = title_text
                row.cells[2].paragraphs[0].text = page_text
                row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

                for idx, cell in enumerate(row.cells):
                    set_cell_margins(cell, top=30, bottom=30, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.line_spacing = 1.05
                    p.paragraph_format.space_after = Pt(0)
                    if p.runs:
                        p.runs[0].font.name = "Times New Roman"
                        p.runs[0].font.size = Pt(8.5)
                        if is_chapter:
                            p.runs[0].font.bold = True

                if is_chapter:
                    set_cell_background(row.cells[0], "F1F5F9")
                    set_cell_background(row.cells[1], "F1F5F9")
                    set_cell_background(row.cells[2], "F1F5F9")

        set_table_borders(toc_table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(toc_table)
        prevent_row_split(toc_table)

    doc.add_page_break()

    # ----------------- 6. LIST OF TABLES (PAGE viii) -----------------
    p_lot_h = doc.add_paragraph()
    p_lot_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot_h.paragraph_format.space_before = Pt(8)
    p_lot_h.paragraph_format.space_after = Pt(12)
    r_lot = p_lot_h.add_run("LIST OF TABLES")
    r_lot.font.size = Pt(16)
    r_lot.font.bold = True
    r_lot.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    lot_match = re.search(r'# LIST OF TABLES\s*\n\n\| Table No\..*?\n\|:?---.*?\n(.*?)(?=\n\n---\n\n<!-- PAGE BREAK: LIST OF FIGURES -->)', fm_content, re.DOTALL)
    if lot_match:
        lot_lines = lot_match.group(1).strip().split('\n')
        lot_table = doc.add_table(rows=1, cols=3)
        lot_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        lot_table.autofit = False
        lot_table.columns[0].width = Inches(1.2)
        lot_table.columns[1].width = Inches(4.2)
        lot_table.columns[2].width = Inches(0.85)

        hdr = lot_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        hdr.cells[0].paragraphs[0].text = "Table No."
        hdr.cells[1].paragraphs[0].text = "Table Title"
        hdr.cells[2].paragraphs[0].text = "Page"
        for cell in hdr.cells:
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.runs[0].font.name = "Times New Roman"
            p.runs[0].font.size = Pt(9.5)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        hdr.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

        for line in lot_lines:
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 3:
                row = lot_table.add_row()
                row.cells[0].width = Inches(1.2)
                row.cells[1].width = Inches(4.2)
                row.cells[2].width = Inches(0.85)

                t_no = parts[0].strip()
                t_title = parts[1].strip()
                t_page = parts[2].strip()

                if page_map and t_no in page_map:
                    t_page = str(page_map[t_no])

                row.cells[0].paragraphs[0].text = t_no
                row.cells[1].paragraphs[0].text = t_title
                row.cells[2].paragraphs[0].text = t_page
                row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

                for cell in row.cells:
                    set_cell_margins(cell, top=30, bottom=30, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.line_spacing = 1.05
                    p.paragraph_format.space_after = Pt(0)
                    if p.runs:
                        p.runs[0].font.name = "Times New Roman"
                        p.runs[0].font.size = Pt(8.5)

        set_table_borders(lot_table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(lot_table)
        prevent_row_split(lot_table)

    doc.add_page_break()

    # ----------------- 7. LIST OF FIGURES (PAGE ix) -----------------
    p_lof_h = doc.add_paragraph()
    p_lof_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof_h.paragraph_format.space_before = Pt(8)
    p_lof_h.paragraph_format.space_after = Pt(12)
    r_lof = p_lof_h.add_run("LIST OF FIGURES")
    r_lof.font.size = Pt(16)
    r_lof.font.bold = True
    r_lof.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

    lof_match = re.search(r'# LIST OF FIGURES\s*\n\n\| Figure No\..*?\n\|:?---.*?\n(.*)', fm_content, re.DOTALL)
    if lof_match:
        lof_lines = lof_match.group(1).strip().split('\n')
        lof_table = doc.add_table(rows=1, cols=3)
        lof_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        lof_table.autofit = False
        lof_table.columns[0].width = Inches(1.2)
        lof_table.columns[1].width = Inches(4.2)
        lof_table.columns[2].width = Inches(0.85)

        hdr = lof_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        hdr.cells[0].paragraphs[0].text = "Figure No."
        hdr.cells[1].paragraphs[0].text = "Figure Title"
        hdr.cells[2].paragraphs[0].text = "Page"
        for cell in hdr.cells:
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.runs[0].font.name = "Times New Roman"
            p.runs[0].font.size = Pt(9.5)
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        hdr.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

        for line in lof_lines:
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 3:
                row = lof_table.add_row()
                row.cells[0].width = Inches(1.2)
                row.cells[1].width = Inches(4.2)
                row.cells[2].width = Inches(0.85)

                f_no = parts[0].strip()
                f_title = parts[1].strip()
                f_page = parts[2].strip()

                if page_map and f_no in page_map:
                    f_page = str(page_map[f_no])

                row.cells[0].paragraphs[0].text = f_no
                row.cells[1].paragraphs[0].text = f_title
                row.cells[2].paragraphs[0].text = f_page
                row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

                for cell in row.cells:
                    set_cell_margins(cell, top=20, bottom=20, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.line_spacing = 1.0
                    p.paragraph_format.space_after = Pt(0)
                    if p.runs:
                        p.runs[0].font.name = "Times New Roman"
                        p.runs[0].font.size = Pt(8.0)

        set_table_borders(lof_table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(lof_table)
        prevent_row_split(lof_table)

    # ==========================================================
    # SECTION 2: BODY (ARABIC NUMBERING RESTARTING AT 1)
    # ==========================================================
    s2 = doc.add_section(WD_SECTION.NEW_PAGE)
    s2.page_width = Inches(8.5)
    s2.page_height = Inches(11.0)
    s2.top_margin = Inches(1.0)
    s2.bottom_margin = Inches(1.0)
    s2.left_margin = Inches(1.25)
    s2.right_margin = Inches(1.0)
    s2.different_first_page_header_footer = False
    s2.header.is_linked_to_previous = False
    s2.footer.is_linked_to_previous = False

    set_section_page_numbering(s2, start=1, num_format='decimal')
    add_right_header(s2.header, "LifeFlow Blood Bank Management System")
    add_centered_page_number(s2.footer)

    print("Front matter generated. Now compiling body chapters...")

    # Helper: Render table from markdown
    def render_body_table(doc, raw_lines, caption_text=""):
        if not raw_lines:
            return
        cleaned_rows = []
        for line in raw_lines:
            if re.match(r'^\s*\|?\s*:?-+:?\s*\|', line):
                continue
            cells = [c.strip() for c in line.split('|')[1:-1]]
            if cells:
                cleaned_rows.append(cells)
        if not cleaned_rows:
            return

        num_cols = max(len(r) for r in cleaned_rows)

        if caption_text:
            p_cap = doc.add_paragraph()
            p_cap.paragraph_format.space_before = Pt(8)
            p_cap.paragraph_format.space_after = Pt(3)
            r_cap = p_cap.add_run(caption_text)
            r_cap.font.name = "Times New Roman"
            r_cap.font.size = Pt(10)
            r_cap.font.bold = True
            r_cap.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)

        table = doc.add_table(rows=len(cleaned_rows), cols=num_cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = True
        col_width = Inches(6.25 / num_cols)
        for col in table.columns:
            col.width = col_width

        for r_idx, row_data in enumerate(cleaned_rows):
            row = table.rows[r_idx]
            is_header = (r_idx == 0)
            for c_idx in range(num_cols):
                cell = row.cells[c_idx]
                cell_text = row_data[c_idx] if c_idx < len(row_data) else ""
                if is_header:
                    set_cell_background(cell, "B71C1C")
                    set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.05
                    clean_hdr = cell_text.replace('**', '')
                    run = p.add_run(clean_hdr)
                    run.font.name = "Times New Roman"
                    run.font.size = Pt(9.0)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                else:
                    if r_idx % 2 == 1:
                        set_cell_background(cell, "FFFFFF")
                    else:
                        set_cell_background(cell, "F8FAFC")
                    set_cell_margins(cell, top=45, bottom=45, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.1
                    format_bold_italic_tokens(p, cell_text, font_size=Pt(8.5))

        set_table_borders(table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(table)
        prevent_row_split(table)

        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(4)

    # Helper: Insert image with smart scaling
    def insert_scaled_image(doc, img_path, caption=""):
        if not os.path.exists(img_path):
            if os.path.exists(img_path.lstrip('/')):
                img_path = img_path.lstrip('/')
            else:
                print(f"Warning: Image not found: {img_path}")
                return

        # Read dimensions
        try:
            im = Image.open(img_path)
            w, h = im.size
            ratio = w / h
        except Exception:
            ratio = 1.5

        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run_img = p_img.add_run()

        # Target max height = 3.2 inches, max width = 5.2 inches
        if ratio >= 1.3:
            # Landscape
            run_img.add_picture(img_path, width=Inches(5.1))
        else:
            # Portrait or near-square
            run_img.add_picture(img_path, height=Inches(3.2))

        # Caption BELOW image
        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = "Times New Roman"
            r_cap.font.size = Pt(9.5)
            r_cap.font.bold = True
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Process markdown chapter
    def append_chapter(filepath, is_first=False):
        if not os.path.exists(filepath):
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if not is_first:
            doc.add_page_break()

        lines = content.split('\n')
        in_code_block = False
        code_lines = []
        code_caption = ""
        in_table = False
        table_lines = []
        table_caption = ""

        # Flag for Ch 8 / Ch 9 diagram pages
        is_diagram_chapter = '08_system_diagrams' in filepath
        is_screen_chapter = '09_screen_outputs' in filepath

        i = 0
        first_section_done = False
        while i < len(lines):
            line = lines[i]
            trimmed = line.strip()

            # Ignore HTML comments
            if trimmed.startswith('<!--') and trimmed.endswith('-->'):
                i += 1
                continue

            # Code block
            if trimmed.startswith('```'):
                if not in_code_block:
                    in_code_block = True
                    code_lines = []
                    if i > 0 and (lines[i-1].strip().startswith('//') or lines[i-1].strip().startswith('### 11.')):
                        code_caption = lines[i-1].strip().replace('### ', '')
                else:
                    in_code_block = False
                    add_code_block(doc, '\n'.join(code_lines), caption_text=code_caption)
                    code_caption = ""
                i += 1
                continue

            if in_code_block:
                code_lines.append(line)
                i += 1
                continue

            # Table
            if trimmed.startswith('|') and '|' in trimmed[1:]:
                if not in_table:
                    in_table = True
                    table_lines = [trimmed]
                else:
                    table_lines.append(trimmed)
                i += 1
                continue
            else:
                if in_table:
                    in_table = False
                    render_body_table(doc, table_lines, table_caption)
                    table_lines = []
                    table_caption = ""

            # Table caption check
            if (trimmed.startswith('### Table') or trimmed.startswith('#### Table') or trimmed.startswith('Table ')) and ':' in trimmed:
                table_caption = trimmed.replace('### ', '').replace('#### ', '')
                i += 1
                continue

            # Chapter Title
            if trimmed.startswith('# CHAPTER'):
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(14)
                p.paragraph_format.space_after = Pt(12)
                run = p.add_run(trimmed.replace('# ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(16)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0xB7, 0x1C, 0x1C)
                i += 1
                continue

            # Heading 2 (e.g. ## 8.1 Class Diagram)
            if trimmed.startswith('## '):
                # If in diagrams or screen outputs chapter, add page break before each diagram/screen except the first
                if (is_diagram_chapter or is_screen_chapter) and first_section_done:
                    doc.add_page_break()
                first_section_done = True

                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after = Pt(3)
                run = p.add_run(trimmed.replace('## ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(13)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
                i += 1
                continue

            # Heading 3
            if trimmed.startswith('### '):
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(2)
                run = p.add_run(trimmed.replace('### ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(11.5)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
                i += 1
                continue

            # Heading 4
            if trimmed.startswith('#### '):
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(2)
                run = p.add_run(trimmed.replace('#### ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(10.5)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
                i += 1
                continue

            # Image: ![Caption](Path)
            img_match = re.match(r'!\[(.*?)\]\((.*?)\)', trimmed)
            if img_match:
                caption = img_match.group(1)
                img_path = img_match.group(2).replace('file:///', '').replace('file://', '')
                insert_scaled_image(doc, img_path, caption=caption)
                i += 1
                continue

            # Bullet points
            if trimmed.startswith('- ') or trimmed.startswith('* '):
                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.2
                format_bold_italic_tokens(p, trimmed[2:].strip(), font_size=Pt(11))
                i += 1
                continue

            # Numbered list
            num_match = re.match(r'^(\d+)\.\s+(.*)', trimmed)
            if num_match:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.2
                p.paragraph_format.left_indent = Inches(0.25)
                r_num = p.add_run(f"{num_match.group(1)}. ")
                r_num.font.name = "Times New Roman"
                r_num.font.bold = True
                r_num.font.size = Pt(11)
                format_bold_italic_tokens(p, num_match.group(2).strip(), font_size=Pt(11))
                i += 1
                continue

            # Divider
            if trimmed.startswith('---'):
                i += 1
                continue

            # Standard paragraph
            if trimmed:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.line_spacing = 1.3
                format_bold_italic_tokens(p, trimmed, font_size=Pt(11))

            i += 1

        if in_table and table_lines:
            render_body_table(doc, table_lines, table_caption)

    # Chapter sequence
    chapter_files = [
        'output/chapters/01_introduction.md',
        'output/chapters/02_project_overview.md',
        'output/chapters/03_feasibility_report.md',
        'output/chapters/04_requirement_specification.md',
        'output/chapters/05_system_design.md',
        'output/chapters/06_database_design_implementation.md',
        'output/chapters/07_system_analysis.md',
        'output/chapters/08_system_diagrams.md',
        'output/chapters/09_screen_outputs.md',
        'output/chapters/10_testing.md',
        'output/chapters/11_source_code.md',
        'output/chapters/12_gantt_chart.md',
        'output/chapters/13_conclusion.md',
        'output/chapters/14_future_scope.md',
        'output/chapters/15_bibliography_references.md'
    ]

    for idx, chap in enumerate(chapter_files):
        print(f"  -> Appending {chap}...")
        append_chapter(chap, is_first=(idx == 0))

    docx_path = os.path.abspath('output/LifeFlow_Project_Report.docx')
    doc.save(docx_path)
    print(f"Calibrated DOCX saved: {docx_path}")
    return docx_path

if __name__ == '__main__':
    build_calibrated_docx()
