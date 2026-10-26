import pymupdf, re

pdf = pymupdf.open('output/LifeFlow_Project_Report.pdf')
fm_count = 10

page_map = {}
for p_idx in range(fm_count, len(pdf)):
    text = pdf[p_idx].get_text()
    arabic_pg = p_idx - fm_count + 1

    # Match Chapter: e.g. "CHAPTER 1: INTRODUCTION"
    c_match = re.search(r'CHAPTER\s+(\d+):\s*([^\n]+)', text)
    if c_match:
        c_num = c_match.group(1)
        c_title = c_match.group(2).strip()
        if f'CHAPTER {c_num}' not in page_map:
            page_map[f'CHAPTER {c_num}'] = arabic_pg
        if f'CHAPTER {c_num}: {c_title}' not in page_map:
            page_map[f'CHAPTER {c_num}: {c_title}'] = arabic_pg

    # Match Sections like 1.1, 1.4.1, etc.
    s_matches = re.findall(r'(?:^|\n)\s*(\d+\.\d+(?:\.\d+)?)\s+([^\n]+)', text)
    for s_num, s_title in s_matches:
        if s_num not in page_map:
            page_map[s_num] = arabic_pg
        full_s = f"{s_num} {s_title.strip()}"
        if full_s not in page_map:
            page_map[full_s] = arabic_pg

    # Match Tables: "Table X.Y: Title"
    t_matches = re.findall(r'Table\s+(\d+\.\d+):', text)
    for t_num in t_matches:
        t_key = f'Table {t_num}'
        if t_key not in page_map:
            page_map[t_key] = arabic_pg

    # Match Figures: "Figure X.Y: Title"
    f_matches = re.findall(r'Figure\s+(\d+\.\d+):', text)
    for f_num in f_matches:
        f_key = f'Figure {f_num}'
        if f_key not in page_map:
            page_map[f_key] = arabic_pg

pdf.close()

print('Total mapped items:', len(page_map))
print('\nFigures:')
for f in ['Figure 5.1', 'Figure 8.1', 'Figure 8.18', 'Figure 9.1', 'Figure 9.12', 'Figure 12.1']:
    print(f'  {f:12s}: page {page_map.get(f, "MISSING")}')

print('\nTables:')
for t in ['Table 3.1', 'Table 4.1', 'Table 6.1', 'Table 10.1', 'Table 12.1']:
    print(f'  {t:12s}: page {page_map.get(t, "MISSING")}')
