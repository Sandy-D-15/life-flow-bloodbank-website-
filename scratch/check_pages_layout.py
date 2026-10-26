import pymupdf, os, re

doc = pymupdf.open('output/LifeFlow_Project_Report.pdf')
os.makedirs('scratch/inspect_pages', exist_ok=True)

# Inspect Chapter 8 pages (PDF pages 61 to 98: indices 60 to 97)
# Chapter 12 pages (PDF pages 132 to 134: indices 131 to 133)
pages_to_inspect = list(range(60, 98)) + [131, 132, 133]

print(f'Checking {len(pages_to_inspect)} pages for layout defects...')
defects_found = []

for p_no in pages_to_inspect:
    page = doc[p_no]
    txt = page.get_text()
    lines = [l.strip() for l in txt.split('\n') if l.strip()]
    il = page.get_images()
    
    # Check 1: Orphaned heading at the very bottom
    if lines:
        last_line = lines[-1]
        second_last = lines[-2] if len(lines) > 1 else ''
        if any(h in last_line for h in ['Architectural Explanation', 'Key Observations']):
            defects_found.append(f'Page {p_no+1}: Orphaned heading at bottom: "{last_line}"')
        if any(h in second_last for h in ['Architectural Explanation', 'Key Observations']) and last_line.isdigit():
            defects_found.append(f'Page {p_no+1}: Orphaned heading above page number: "{second_last}"')

    # Check 2: Figure caption placement (captions start with Figure X:)
    for l in lines:
        if re.match(r'^Figure\s+(8\.\d+|12\.1):', l):
            if not il:
                defects_found.append(f'Page {p_no+1}: Figure caption "{l}" present but NO image on page!')

    # Check 3: Image overlap / bounding box
    for img in page.get_image_info():
        bbox = img['bbox']
        x0, y0, x1, y1 = bbox
        if y0 < 50:
            defects_found.append(f'Page {p_no+1}: Image overlaps top header! y0={y0:.1f}')
        if y1 > 740:
            defects_found.append(f'Page {p_no+1}: Image overlaps bottom footer! y1={y1:.1f}')
        if x0 < 70 or x1 > 560:
            defects_found.append(f'Page {p_no+1}: Image extends past margins! x0={x0:.1f}, x1={x1:.1f}')

if defects_found:
    print('Defects found:')
    for d in defects_found:
        print('  -', d)
else:
    print('PERFECT! ZERO layout defects found across all inspected pages!')
