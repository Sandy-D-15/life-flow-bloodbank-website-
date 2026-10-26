import fitz, re, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('output/LifeFlow_Project_Report.pdf')
fm_count = 10

# Scan actual chapter/section positions
actual_headings = {}
for p_idx in range(fm_count, len(doc)):
    text = doc[p_idx].get_text()
    arabic_pg = p_idx - fm_count + 1
    
    # Chapters
    m_ch = re.search(r'CHAPTER\s+(\d+):', text)
    if m_ch:
        ch_num = m_ch.group(1)
        if f"CHAPTER {ch_num}" not in actual_headings:
            actual_headings[f"CHAPTER {ch_num}"] = arabic_pg
            
    for line in text.splitlines():
        line = line.strip()
        # Headings look like: "## 10.1 Introduction" or "10.1 Introduction"
        # In docx, heading paragraphs are rendered as lines like "10.1 Introduction", "1.1 Background"
        m = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+([A-Z][A-Za-z0-9\s\(\)\-–—\:\,\.\/\&]+)$', line)
        if m:
            s_num = m.group(1)
            s_title = m.group(2).strip()
            # Filter out table cells or version strings
            if not s_title.startswith('(') and 'License' not in s_title and len(s_title) > 3:
                # Only record the first occurrence that looks like an actual heading
                if s_num not in actual_headings:
                    # check that it's likely a heading in its chapter
                    ch_prefix = s_num.split('.')[0]
                    # verify this page is within or after that chapter's start
                    actual_headings[s_num] = (arabic_pg, s_title)

# Read TOC pages
print("Checking TOC pages 6, 7, 8 (0-indexed 5, 6, 7)...")
for p_idx in [5, 6, 7]:
    text = doc[p_idx].get_text()
    for line in text.splitlines():
        line = line.strip()
        m = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s+(.+?)\s+(\d+)$', line)
        if m:
            sec = m.group(1)
            title = m.group(2).strip()
            toc_pg = int(m.group(3))
            if sec in actual_headings:
                act_pg, act_title = actual_headings[sec]
                if toc_pg != act_pg:
                    print(f"MISMATCH for section {sec}: TOC says {toc_pg}, actual heading '{act_title}' is on p. {act_pg}")
doc.close()
