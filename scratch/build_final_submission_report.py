import os
import re
import sys
import time
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
from PIL import Image
import pymupdf
import win32com.client as win32

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
def set_table_fixed_layout(table):
    tblPr = table._tbl.tblPr
    tblLayout = parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>')
    tblPr.append(tblLayout)

def set_cell_width(cell, width_dxa):
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{width_dxa}" w:type="dxa"/>')
    tcPr.append(tcW)

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

def assemble_master_document(page_map=None, output_docx='output/LifeFlow_Project_Report.docx'):
    doc = Document()

    # Section 0: Cover Page
    s0 = doc.sections[0]
    s0.page_width = Inches(8.5)
    s0.page_height = Inches(11.0)
    s0.top_margin = Inches(1.0)
    s0.bottom_margin = Inches(1.0)
    s0.left_margin = Inches(1.25)
    s0.right_margin = Inches(1.0)
    s0.different_first_page_header_footer = False

    normal = doc.styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(11.5)
    normal.paragraph_format.line_spacing = 1.32
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.space_after = Pt(3.5)

    # 1. COVER PAGE
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

    # SECTION 1: FRONT MATTER
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

    # 2. CERTIFICATE (PAGE ii)
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

    # 3. ABSTRACT (PAGE iii)
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

    # 4. ACKNOWLEDGEMENT (PAGE iv)
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

    # 5. TABLE OF CONTENTS
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
        set_table_fixed_layout(toc_table)

        hdr = toc_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        set_cell_width(hdr.cells[0], 1152) # 0.8 in
        set_cell_width(hdr.cells[1], 6336) # 4.4 in
        set_cell_width(hdr.cells[2], 1152) # 0.8 in
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
                set_cell_width(row.cells[0], 1152)
                set_cell_width(row.cells[1], 6336)
                set_cell_width(row.cells[2], 1152)

                sr_text = parts[0].replace('**', '').strip()
                title_text = parts[1].replace('**', '').replace('&emsp;', '    ').strip()
                page_text = parts[2].replace('**', '').strip()

                if page_map:
                    clean_title = title_text.strip()
                    m_sec = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+', clean_title)
                    m_chap = re.search(r'CHAPTER\s+(\d+)', clean_title)
                    if m_sec and m_sec.group(1) in page_map:
                        page_text = str(page_map[m_sec.group(1)])
                    elif m_chap and f"CHAPTER {m_chap.group(1)}" in page_map:
                        page_text = str(page_map[f"CHAPTER {m_chap.group(1)}"])
                    elif clean_title in page_map:
                        page_text = str(page_map[clean_title])

                is_chapter = 'CHAPTER' in title_text or (parts[0].isdigit() and not '.' in parts[0])

                row.cells[0].paragraphs[0].text = sr_text
                row.cells[1].paragraphs[0].text = title_text
                row.cells[2].paragraphs[0].text = page_text
                row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

                for idx, cell in enumerate(row.cells):
                    set_cell_margins(cell, top=28, bottom=28, left=80, right=80)
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

    # 6. LIST OF TABLES
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
        set_table_fixed_layout(lot_table)

        hdr = lot_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        set_cell_width(hdr.cells[0], 1440) # 1.0 in
        set_cell_width(hdr.cells[1], 6048) # 4.2 in
        set_cell_width(hdr.cells[2], 1152) # 0.8 in
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
                set_cell_width(row.cells[0], 1440)
                set_cell_width(row.cells[1], 6048)
                set_cell_width(row.cells[2], 1152)

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
                    set_cell_margins(cell, top=28, bottom=28, left=80, right=80)
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

    # 7. LIST OF FIGURES
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
        set_table_fixed_layout(lof_table)

        hdr = lof_table.rows[0]
        set_cell_background(hdr.cells[0], "B71C1C")
        set_cell_background(hdr.cells[1], "B71C1C")
        set_cell_background(hdr.cells[2], "B71C1C")
        set_cell_width(hdr.cells[0], 1440)
        set_cell_width(hdr.cells[1], 6048)
        set_cell_width(hdr.cells[2], 1152)
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
                set_cell_width(row.cells[0], 1440)
                set_cell_width(row.cells[1], 6048)
                set_cell_width(row.cells[2], 1152)

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
                    set_cell_margins(cell, top=18, bottom=18, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.line_spacing = 1.0
                    p.paragraph_format.space_after = Pt(0)
                    if p.runs:
                        p.runs[0].font.name = "Times New Roman"
                        p.runs[0].font.size = Pt(8.0)

        set_table_borders(lof_table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(lof_table)
        prevent_row_split(lof_table)

    # SECTION 2: BODY
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
                    set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
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
                    set_cell_margins(cell, top=40, bottom=40, left=80, right=80)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(0)
                    p.paragraph_format.line_spacing = 1.1
                    format_bold_italic_tokens(p, cell_text, font_size=Pt(8.5))

        set_table_borders(table, color="CBD5E1", sz="4", val="single")
        make_header_repeat(table)
        prevent_row_split(table)

        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(0)
        p_after.paragraph_format.space_after = Pt(3)

    def insert_diagram_figure(doc, img_path, caption=""):
        if not os.path.exists(img_path):
            if os.path.exists(img_path.lstrip('/')):
                img_path = img_path.lstrip('/')
            elif os.path.basename(img_path) in os.listdir('diagrams_native'):
                img_path = os.path.join('diagrams_native', os.path.basename(img_path))

        fig_match = re.search(r'Figure\s+(8\.\d+|12\.1)', caption)
        fig_num = fig_match.group(1) if fig_match else ""

        # Special handling for Figure 8.6: 2-column borderless table
        if fig_num == '8.6':
            img_a = 'diagrams_native/img-005.png'
            img_b = 'diagrams_native/img-006.png'
            table = doc.add_table(rows=2, cols=2)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False
            set_table_fixed_layout(table)

            for r in range(2):
                set_cell_width(table.cell(r, 0), 4500)
                set_cell_width(table.cell(r, 1), 4500)
                set_cell_margins(table.cell(r, 0), top=20, bottom=20, left=40, right=40)
                set_cell_margins(table.cell(r, 1), top=20, bottom=20, left=40, right=40)

            # Cell (0, 0): (a) Appointment Status Image
            p00 = table.cell(0, 0).paragraphs[0]
            p00.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p00.paragraph_format.space_before = Pt(0)
            p00.paragraph_format.space_after = Pt(2)
            p00.paragraph_format.keep_with_next = True
            p00.add_run().add_picture(img_a, width=Inches(2.85))

            # Cell (1, 0): Sub-caption (a)
            p10 = table.cell(1, 0).paragraphs[0]
            p10.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p10.paragraph_format.space_before = Pt(0)
            p10.paragraph_format.space_after = Pt(4)
            r10 = p10.add_run("(a) Appointment status")
            r10.font.name = "Times New Roman"
            r10.font.size = Pt(9.0)
            r10.font.italic = True
            r10.font.bold = True
            r10.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

            # Cell (0, 1): (b) Certificate Status Image
            p01 = table.cell(0, 1).paragraphs[0]
            p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p01.paragraph_format.space_before = Pt(0)
            p01.paragraph_format.space_after = Pt(2)
            p01.paragraph_format.keep_with_next = True
            p01.add_run().add_picture(img_b, width=Inches(2.85))

            # Cell (1, 1): Sub-caption (b)
            p11 = table.cell(1, 1).paragraphs[0]
            p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p11.paragraph_format.space_before = Pt(0)
            p11.paragraph_format.space_after = Pt(4)
            r11 = p11.add_run("(b) Certificate status")
            r11.font.name = "Times New Roman"
            r11.font.size = Pt(9.0)
            r11.font.italic = True
            r11.font.bold = True
            r11.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

            set_table_borders(table, color="FFFFFF", sz="0", val="none")
            prevent_row_split(table)

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(4)
            p_cap.paragraph_format.space_after = Pt(6)
            p_cap.paragraph_format.keep_together = True
            r_cap = p_cap.add_run(caption if caption else "Figure 8.6: State Machine Diagrams")
            r_cap.font.name = "Times New Roman"
            r_cap.font.size = Pt(9.0)
            r_cap.font.bold = True
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

            doc.add_page_break()
            return

        try:
            im = Image.open(img_path)
            w, h = im.size
            ratio = w / h
        except Exception:
            ratio = 1.0

        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(6)
        p_img.paragraph_format.keep_with_next = True
        run_img = p_img.add_run()

        # Aspect ratio sizing rules:
        # <= 0.7: very tall (8.1, 8.5, 8.11) -> Height 7.0", width auto
        # 0.7 - 1.2: (8.3, 8.4, 8.9, 8.13, 8.15) -> Width 5.6" to 6.0"
        # > 1.2: wide (8.2, 8.7, 8.8, 8.10, 8.12, 8.14, 8.16, 8.17, 8.18, 12.1) -> Width 6.25"
        if ratio <= 0.7:
            run_img.add_picture(img_path, height=Inches(7.0))
        elif ratio <= 1.2:
            if fig_num in ['8.9', '8.15']:
                run_img.add_picture(img_path, width=Inches(6.0))
            else:
                run_img.add_picture(img_path, width=Inches(5.6))
        else:
            run_img.add_picture(img_path, width=Inches(6.25))

        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(6)
            p_cap.paragraph_format.keep_together = True
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = "Times New Roman"
            r_cap.font.size = Pt(9.0)
            r_cap.font.bold = True
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

        if fig_num.startswith('8.'):
            doc.add_page_break()

    def insert_scaled_image(doc, img_path, caption="", is_diagram=False):
        if not os.path.exists(img_path):
            if os.path.exists(img_path.lstrip('/')):
                img_path = img_path.lstrip('/')
            else:
                return

        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(2)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(6.25))

        if caption:
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(4)
            p_cap.paragraph_format.keep_together = True
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = "Times New Roman"
            r_cap.font.size = Pt(9.0)
            r_cap.font.bold = True
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

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

        is_diagram_chapter = '08_system_diagrams' in filepath
        is_screen_chapter = '09_screen_outputs' in filepath
        is_gantt_chapter = '12_gantt_chart' in filepath

        i = 0
        first_section_done = False
        in_key_observations = False
        seen_image_in_section = False

        while i < len(lines):
            line = lines[i]
            trimmed = line.strip().replace(r'\times', '×')

            if trimmed.startswith('<!--') and trimmed.endswith('-->'):
                i += 1
                continue

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

            if (trimmed.startswith('### Table') or trimmed.startswith('#### Table') or trimmed.startswith('Table ')) and ':' in trimmed:
                table_caption = trimmed.replace('### ', '').replace('#### ', '')
                i += 1
                continue

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

            if trimmed.startswith('## '):
                in_key_observations = False
                seen_image_in_section = False
                if (is_diagram_chapter or is_screen_chapter) and first_section_done:
                    doc.add_page_break()
                first_section_done = True

                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(6) if is_diagram_chapter else Pt(10)
                p.paragraph_format.space_after = Pt(2) if is_diagram_chapter else Pt(3)
                p.paragraph_format.keep_with_next = True
                run = p.add_run(trimmed.replace('## ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(12) if is_diagram_chapter else Pt(13)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
                i += 1
                continue

            if trimmed.startswith('### '):
                in_key_observations = ('Key Observations' in trimmed)
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(6) if is_diagram_chapter else Pt(8)
                p.paragraph_format.space_after = Pt(2) if is_diagram_chapter else Pt(2)
                p.paragraph_format.keep_with_next = True
                run = p.add_run(trimmed.replace('### ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(10.5) if is_diagram_chapter else Pt(11.5)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
                i += 1
                continue

            if trimmed.startswith('#### '):
                in_key_observations = False
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.keep_with_next = True
                run = p.add_run(trimmed.replace('#### ', ''))
                run.font.name = "Times New Roman"
                run.font.size = Pt(10)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
                i += 1
                continue

            img_match = re.match(r'!\[(.*?)\]\((.*?)\)', trimmed)
            if img_match:
                seen_image_in_section = True
                caption = img_match.group(1)
                img_path = img_match.group(2).replace('file:///', '').replace('file://', '')
                if is_diagram_chapter or is_gantt_chapter:
                    insert_diagram_figure(doc, img_path, caption=caption)
                else:
                    insert_scaled_image(doc, img_path, caption=caption, is_diagram=False)
                i += 1
                continue

            if trimmed.startswith('- ') or trimmed.startswith('* '):
                # Count remaining consecutive bullets in current block
                k = i
                bullet_count = 0
                while k < len(lines) and (lines[k].strip().startswith('- ') or lines[k].strip().startswith('* ')):
                    bullet_count += 1
                    k += 1

                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(1.5) if is_diagram_chapter else Pt(2)
                p.paragraph_format.line_spacing = 1.15 if is_diagram_chapter else 1.2
                p.paragraph_format.keep_together = True

                # If under Key Observations and <= 4 bullets, bind block together
                if in_key_observations and bullet_count > 1:
                    p.paragraph_format.keep_with_next = True

                format_bold_italic_tokens(p, trimmed[2:].strip(), font_size=Pt(10) if is_diagram_chapter else Pt(11))
                i += 1
                continue

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

            if trimmed.startswith('---'):
                i += 1
                continue

            if trimmed:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(2.5) if is_diagram_chapter else Pt(4)
                p.paragraph_format.line_spacing = 1.15 if is_diagram_chapter else 1.3
                if is_diagram_chapter and not seen_image_in_section:
                    p.paragraph_format.keep_with_next = True
                format_bold_italic_tokens(p, trimmed, font_size=Pt(10) if is_diagram_chapter else Pt(11))

            i += 1

        if in_table and table_lines:
            render_body_table(doc, table_lines, table_caption)

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
        append_chapter(chap, is_first=(idx == 0))

    out_abs = os.path.abspath(output_docx)
    doc.save(out_abs)
    print(f"DOCX saved: {out_abs}")
    return out_abs

def export_docx_to_pdf(docx_path, pdf_path):
    print(f"Exporting to PDF: {pdf_path}")
    word = win32.Dispatch('Word.Application')
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath(docx_path))
        time.sleep(1)
        doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
        doc.Close()
    finally:
        word.Quit()
    print(f"Export finished: {pdf_path}")

def enhance_pdf_diagram_quality(pdf_path):
    print(f"\n--- Post-Processing: Injecting Native High-Res Diagrams into {pdf_path} ---")
    doc = pymupdf.open(pdf_path)

    diagram_mapping = {
        '5.1': ['diagrams_native/img-012.png'],
        '5.2': ['diagrams_native/fig_5_2_navigation_tree.png'],
        '8.1': ['diagrams_native/img-000.png'],
        '8.2': ['diagrams_native/img-001.png'],
        '8.3': ['diagrams_native/img-002.png'],
        '8.4': ['diagrams_native/img-003.png'],
        '8.5': ['diagrams_native/img-004.png'],
        '8.6': ['diagrams_native/img-005.png', 'diagrams_native/img-006.png'],
        '8.7': ['diagrams_native/img-007.png'],
        '8.8': ['diagrams_native/img-008.png'],
        '8.9': ['diagrams_native/img-009.png'],
        '8.10': ['diagrams_native/img-010.png'],
        '8.11': ['diagrams_native/img-011.png'],
        '8.12': ['diagrams_native/img-012.png'],
        '8.13': ['diagrams_native/img-013.png'],
        '8.14': ['diagrams_native/img-014.png'],
        '8.15': ['diagrams_native/img-015.png'],
        '8.16': ['diagrams_native/img-016.png'],
        '8.17': ['diagrams_native/img-017.png'],
        '8.18': ['diagrams_native/img-018.png'],
        '12.1': ['diagrams_native/img-019.png'],
    }

    screen_mapping = {
        '9.1': 'screenshots/9.1_home_hero.png',
        '9.2': 'screenshots/9.2_live_inventory_overview.png',
        '9.3': 'screenshots/9.3_blood_availability_charts.png',
        '9.4': 'screenshots/9.4_donor_registration.png',
        '9.5': 'screenshots/9.5_donation_center_map.png',
        '9.6': 'screenshots/9.6_hospital_request_form.png',
        '9.7': 'screenshots/9.7_request_tracker.png',
        '9.8': 'screenshots/9.8_admin_login.png',
        '9.9': 'screenshots/9.9_admin_dashboard.png',
        '9.10': 'screenshots/9.10_inventory_mutation_audit.png',
        '9.11': 'screenshots/9.11_donor_registry_csv.png',
        '9.12': 'screenshots/9.12_validation_error_states.png',
    }

    replaced_count = 0
    for p_no in range(len(doc)):
        page = doc[p_no]
        txt = page.get_text()
        il = page.get_images()
        if not il:
            continue

        m_diag = re.search(r'Figure\s+(5\.\d+|8\.\d+|12\.1):', txt)
        if m_diag:
            fig_key = m_diag.group(1)
            if fig_key in diagram_mapping:
                imgs = diagram_mapping[fig_key]
                for idx, img_file in enumerate(imgs):
                    if idx < len(il) and os.path.exists(img_file):
                        xref = il[idx][0]
                        page.replace_image(xref, filename=img_file)
                        replaced_count += 1
                        print(f"  Page {p_no + 1}: Injected native Fig {fig_key} ({img_file})")

        m_screen = re.search(r'Figure\s+(9\.\d+):', txt)
        if m_screen:
            scr_key = m_screen.group(1)
            if scr_key in screen_mapping:
                img_file = screen_mapping[scr_key]
                if len(il) >= 1 and os.path.exists(img_file):
                    xref = il[0][0]
                    page.replace_image(xref, filename=img_file)
                    replaced_count += 1
                    print(f"  Page {p_no + 1}: Injected native screenshot Fig {scr_key} ({img_file})")

    temp_path = pdf_path + ".tmp.pdf"
    doc.save(temp_path, garbage=3, deflate=True)
    doc.close()

    time.sleep(0.5)
    os.replace(temp_path, pdf_path)
    print(f"[SUCCESS] Native high-resolution images injected into {pdf_path} (Total replaced: {replaced_count})")

def run_calibration():
    docx_file = 'output/LifeFlow_Project_Report.docx'
    pdf_file = 'output/LifeFlow_Project_Report.pdf'

    # Step 1: Pass 1 Assembly
    print("\n--- STEP 1: Pass 1 Build ---")
    assemble_master_document(page_map=None, output_docx=docx_file)
    export_docx_to_pdf(docx_file, pdf_file)

    # Step 2: Read exact locations from generated PDF
    print("\n--- STEP 2: Scanning PDF for Exact Arabic Locations ---")
    pdf = pymupdf.open(pdf_file)
    fm_count = 10
    total_pages = len(pdf)
    print(f"Total pages in Pass 1: {total_pages}")

    page_map = {}
    current_chapter = 0
    for p_idx in range(fm_count, total_pages):
        text = pdf[p_idx].get_text()
        arabic_pg = p_idx - fm_count + 1

        c_match = re.search(r'CHAPTER\s+(\d+):\s*([^\n]+)', text)
        if c_match:
            c_num = c_match.group(1)
            current_chapter = int(c_num)
            c_title = c_match.group(2).strip()
            if f'CHAPTER {c_num}' not in page_map:
                page_map[f'CHAPTER {c_num}'] = arabic_pg
            if f'CHAPTER {c_num}: {c_title}' not in page_map:
                page_map[f'CHAPTER {c_num}: {c_title}'] = arabic_pg

        s_matches = re.findall(r'(?:^|\n)\s*(\d+\.\d+(?:\.\d+)?)\s+([A-Z][^\n]+)', text)
        for s_num, s_title in s_matches:
            try:
                major = int(s_num.split('.')[0])
            except ValueError:
                continue
            if major == current_chapter:
                if s_num not in page_map:
                    page_map[s_num] = arabic_pg
                full_s = f"{s_num} {s_title.strip()}"
                if full_s not in page_map:
                    page_map[full_s] = arabic_pg

        t_matches = re.findall(r'Table\s+(\d+\.\d+):', text)
        for t_num in t_matches:
            t_key = f'Table {t_num}'
            if t_key not in page_map:
                page_map[t_key] = arabic_pg

        f_matches = re.findall(r'Figure\s+(\d+\.\d+):', text)
        for f_num in f_matches:
            f_key = f'Figure {f_num}'
            if f_key not in page_map:
                page_map[f_key] = arabic_pg

    pdf.close()
    print(f"Extracted {len(page_map)} mapped target locations.")

    # Step 3: Pass 2 Assembly with exact page map
    print("\n--- STEP 3: Pass 2 Build with Synchronized TOC/LOT/LOF ---")
    assemble_master_document(page_map=page_map, output_docx=docx_file)
    time.sleep(1)
    export_docx_to_pdf(docx_file, pdf_file)

    # Step 4: Check if Pass 2 caused any shift
    pdf2 = pymupdf.open(pdf_file)
    page_map_pass2 = {}
    total_pages_p2 = len(pdf2)
    current_chapter_p2 = 0
    for p_idx in range(fm_count, total_pages_p2):
        text = pdf2[p_idx].get_text()
        arabic_pg = p_idx - fm_count + 1
        c_match = re.search(r'CHAPTER\s+(\d+):\s*([^\n]+)', text)
        if c_match:
            current_chapter_p2 = int(c_match.group(1))
        s_matches = re.findall(r'(?:^|\n)\s*(\d+\.\d+(?:\.\d+)?)\s+([A-Z][^\n]+)', text)
        for s_num, s_title in s_matches:
            try:
                major = int(s_num.split('.')[0])
            except ValueError:
                continue
            if major == current_chapter_p2:
                if s_num not in page_map_pass2:
                    page_map_pass2[s_num] = arabic_pg
        f_matches = re.findall(r'Figure\s+(\d+\.\d+):', text)
        for f_num in f_matches:
            f_key = f'Figure {f_num}'
            if f_key not in page_map_pass2:
                page_map_pass2[f_key] = arabic_pg
    pdf2.close()

    mismatches = 0
    for k, v in page_map.items():
        if k in page_map_pass2 and page_map_pass2[k] != v:
            print(f"  Shift detected for {k}: {v} -> {page_map_pass2[k]}")
            mismatches += 1

    if mismatches > 0:
        print(f"Re-running Pass 3 to synchronize {mismatches} shifted target pages...")
        assemble_master_document(page_map=page_map_pass2, output_docx=docx_file)
        time.sleep(1)
        export_docx_to_pdf(docx_file, pdf_file)

    # Step 5: Post-Processing - Inject Native High-Resolution Images
    enhance_pdf_diagram_quality(pdf_file)

    # Step 6: Final Verification
    final_pdf = pymupdf.open(pdf_file)
    final_count = len(final_pdf)
    final_pdf.close()

    print("\n" + "="*60)
    print("FINAL REPORT DELIVERABLE SUMMARY:")
    print(f"  Master DOCX: {os.path.abspath(docx_file)} ({os.path.getsize(docx_file)/1024/1024:.2f} MB)")
    print(f"  Final PDF:   {os.path.abspath(pdf_file)} ({os.path.getsize(pdf_file)/1024/1024:.2f} MB)")
    print(f"  Total Pages: {final_count}")
    print("="*60 + "\n")

if __name__ == '__main__':
    run_calibration()

