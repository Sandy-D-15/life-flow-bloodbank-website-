import win32com.client as win32
import os, sys, time

in_docx = os.path.abspath('output/LifeFlow_Project_Report.docx')
out_pdf = os.path.abspath('output/LifeFlow_Project_Report.pdf')

print(f"Opening Word to convert:\n  IN:  {in_docx}\n  OUT: {out_pdf}")
word = win32.Dispatch('Word.Application')
word.Visible = False

try:
    doc = word.Documents.Open(in_docx)
    # 17 = wdFormatPDF
    doc.SaveAs(out_pdf, FileFormat=17)
    doc.Close()
    print("Conversion completed successfully.")
finally:
    word.Quit()
