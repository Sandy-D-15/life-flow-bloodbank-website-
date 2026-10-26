import pymupdf
import os

pdf_path = 'output/LifeFlow_Project_Report.pdf'
pdf = pymupdf.open(pdf_path)
print(f"Opened {pdf_path}, total pages: {len(pdf)}")

os.makedirs('scratch/inspect_pages', exist_ok=True)

# Target pages:
# 1: Cover
# 2: Certificate
# 5: TOC start
# 9: LOT
# 10: LOF
# 11: Chapter 1 start
# 15: Table 4.1 (FR matrix)
# 51: Figure 8.1 (Class Diagram)
# 70: Figure 9.1 (Home screen)
# 90: Code extract 11.1
# 103: Gantt Chart Figure 12.1

pages_to_render = [
    (1, '01_cover.png'),
    (2, '02_certificate.png'),
    (5, '05_toc.png'),
    (9, '09_lot.png'),
    (10, '10_lof.png'),
    (11, '11_chapter1_intro.png'),
    (15, '15_table4_1_requirements.png'),
    (51, '51_diagram_8_1_class.png'),
    (70, '70_screen_9_1_home.png'),
    (90, '90_code_11_1.png'),
    (103, '103_gantt_12_1.png')
]

for pg_num, filename in pages_to_render:
    if pg_num <= len(pdf):
        page = pdf[pg_num - 1]
        pix = page.get_pixmap(dpi=150)
        out_path = os.path.join('scratch/inspect_pages', filename)
        pix.save(out_path)
        print(f"Rendered Page {pg_num:3d} -> {out_path} ({pix.width}x{pix.height})")

pdf.close()
