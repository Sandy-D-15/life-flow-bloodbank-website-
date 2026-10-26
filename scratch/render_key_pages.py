import pymupdf, os

doc = pymupdf.open('output/LifeFlow_Project_Report.pdf')
out_dir = 'scratch/inspect_renders'
os.makedirs(out_dir, exist_ok=True)

# Select key pages:
# 63: 8.1 Class diagram
# 64: 8.1 Explanation + Observations
# 71: 8.5 Activity diagram
# 73: 8.6 State machine 2-column table
# 83: 8.11 DFD-1
# 85: 8.12 Architecture
# 132: 12.1 Gantt chart
pages = [62, 63, 70, 72, 82, 84, 131]

for p in pages:
    page = doc[p]
    pix = page.get_pixmap(dpi=150)
    fn = os.path.join(out_dir, f'page_{p+1}.png')
    pix.save(fn)
    print(f'Rendered PDF page {p+1} to {fn} ({pix.width}x{pix.height})')

doc.close()
print('All key sample pages rendered at 150 DPI successfully!')
