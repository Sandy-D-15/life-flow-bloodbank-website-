import win32com.client as win32
import os, pymupdf

word = win32.Dispatch('Word.Application')
word.Visible = False
in_docx = os.path.abspath('scratch/test_pagination.docx')
out_pdf = os.path.abspath('scratch/test_pagination.pdf')
doc = word.Documents.Open(in_docx)
doc.SaveAs(out_pdf, FileFormat=17)
doc.Close()
word.Quit()

pdf = pymupdf.open(out_pdf)
print('PDF pages count:', len(pdf))
for i, p in enumerate(pdf):
    txt = p.get_text().strip()
    last = txt.split()[-1] if txt else '[EMPTY]'
    print(f'Page {i+1}: text ending = {last}')
