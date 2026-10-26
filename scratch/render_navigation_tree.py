import os
from PIL import Image, ImageDraw, ImageFont

def render_navigation_tree(output_path="diagrams_native/fig_5_2_navigation_tree.png"):
    width = 2400
    height = 1350
    img = Image.new("RGB", (width, height), color="#FFFFFF")
    draw = ImageDraw.Draw(img)

    # Fonts
    font_dir = r"C:\Windows\Fonts"
    f_root = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 38)
    f_root_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 22)
    f_branch = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 28)
    f_badge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 18)
    f_item_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 22)
    f_item_desc = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 18)

    # Top Root Box
    root_w, root_h = 800, 100
    root_x = (width - root_w) // 2
    root_y = 50

    # Draw Root Shadow & Box
    draw.rounded_rectangle([root_x + 4, root_y + 4, root_x + root_w + 4, root_y + root_h + 4], radius=16, fill="#E2E8F0")
    draw.rounded_rectangle([root_x, root_y, root_x + root_w, root_y + root_h], radius=16, fill="#B71C1C", outline="#991B1B", width=3)
    
    # Root Text
    t1 = "LifeFlow Blood Bank Management System"
    t2 = "Single Page Application (SPA) Architectural Navigation Hierarchy"
    bbox1 = draw.textbbox((0, 0), t1, font=f_root)
    bbox2 = draw.textbbox((0, 0), t2, font=f_root_sub)
    draw.text((root_x + (root_w - (bbox1[2] - bbox1[0])) // 2, root_y + 18), t1, fill="#FFFFFF", font=f_root)
    draw.text((root_x + (root_w - (bbox2[2] - bbox2[0])) // 2, root_y + 62), t2, fill="#FECACA", font=f_root_sub)

    # Column Dimensions
    col_w = 1040
    col1_x = 100
    col2_x = 1260
    branch_y = 210
    branch_h = 75

    # Center connector stem from root
    stem_x = width // 2
    draw.line([(stem_x, root_y + root_h), (stem_x, 180)], fill="#64748B", width=4)
    draw.line([(col1_x + col_w // 2, 180), (col2_x + col_w // 2, 180)], fill="#64748B", width=4)
    draw.line([(col1_x + col_w // 2, 180), (col1_x + col_w // 2, branch_y)], fill="#64748B", width=4)
    draw.line([(col2_x + col_w // 2, 180), (col2_x + col_w // 2, branch_y)], fill="#64748B", width=4)

    # --- Column 1: Public Portal ---
    # Branch Header
    draw.rounded_rectangle([col1_x + 3, branch_y + 3, col1_x + col_w + 3, branch_y + branch_h + 3], radius=12, fill="#E2E8F0")
    draw.rounded_rectangle([col1_x, branch_y, col1_x + col_w, branch_y + branch_h], radius=12, fill="#0F172A", outline="#334155", width=2)
    draw.text((col1_x + 30, branch_y + 14), "Public & Clinical Portal", fill="#FFFFFF", font=f_branch)
    # Badge
    b1_text = "Unauthenticated / Public Access"
    b1_bbox = draw.textbbox((0, 0), b1_text, font=f_badge)
    b1_w = b1_bbox[2] - b1_bbox[0] + 20
    b1_x = col1_x + col_w - b1_w - 20
    draw.rounded_rectangle([b1_x, branch_y + 22, b1_x + b1_w, branch_y + 54], radius=6, fill="#1E293B", outline="#475569", width=1)
    draw.text((b1_x + 10, branch_y + 27), b1_text, fill="#38BDF8", font=f_badge)

    col1_items = [
        ("Home View", "Hero banner, live KPI summary badges, quick action triggers, system overview"),
        ("Live Blood Availability", "8-phenotype stock cards, threshold warning alerts, Chart.js visuals, compatibility matrix"),
        ("Register as Donor", "Multi-step pre-screening form, WHO 56-day rest calculator, center locator, digital QR pass"),
        ("Hospital Emergency Request", "Clinical blood requisition form, urgency triage selection (Normal / Urgent / Critical)"),
        ("Chain-of-Custody Tracker", "Sanitized 4-stage stepper, live custody audit log, courier transport notices"),
        ("Contact & FAQ Support", "Emergency medical helpline, donor guidelines, regional center operational directory")
    ]

    card_y = branch_y + branch_h + 35
    card_h = 120
    gap = 25

    # Vertical trunk line
    trunk1_x = col1_x + 40
    last_card_y = card_y + (len(col1_items) - 1) * (card_h + gap) + card_h // 2
    draw.line([(col1_x + col_w // 2, branch_y + branch_h), (col1_x + col_w // 2, card_y - 18)], fill="#64748B", width=3)
    draw.line([(col1_x + col_w // 2, card_y - 18), (trunk1_x, card_y - 18)], fill="#64748B", width=3)
    draw.line([(trunk1_x, card_y - 18), (trunk1_x, last_card_y)], fill="#64748B", width=3)

    for idx, (title, desc) in enumerate(col1_items):
        y = card_y + idx * (card_h + gap)
        # horizontal connector
        draw.line([(trunk1_x, y + card_h // 2), (col1_x + 80, y + card_h // 2)], fill="#64748B", width=3)
        draw.ellipse([trunk1_x - 5, y + card_h // 2 - 5, trunk1_x + 5, y + card_h // 2 + 5], fill="#0F172A")

        # Card box
        bx = col1_x + 80
        bw = col_w - 80
        draw.rounded_rectangle([bx + 3, y + 3, bx + bw + 3, y + card_h + 3], radius=10, fill="#E2E8F0")
        draw.rounded_rectangle([bx, y, bx + bw, y + card_h], radius=10, fill="#F8FAFC", outline="#CBD5E1", width=2)
        
        # Color bar indicator
        draw.rounded_rectangle([bx, y, bx + 8, y + card_h], radius=4, fill="#0284C7")

        # Text
        draw.text((bx + 25, y + 20), f"{idx+1}.  {title}", fill="#0F172A", font=f_item_title)
        draw.text((bx + 25, y + 62), desc, fill="#475569", font=f_item_desc)


    # --- Column 2: Admin Portal ---
    # Branch Header
    draw.rounded_rectangle([col2_x + 3, branch_y + 3, col2_x + col_w + 3, branch_y + branch_h + 3], radius=12, fill="#E2E8F0")
    draw.rounded_rectangle([col2_x, branch_y, col2_x + col_w, branch_y + branch_h], radius=12, fill="#7F1D1D", outline="#991B1B", width=2)
    draw.text((col2_x + 30, branch_y + 14), "Secure Administrator Command Portal", fill="#FFFFFF", font=f_branch)
    # Badge
    b2_text = "Bearer Token Protected (PBKDF2)"
    b2_bbox = draw.textbbox((0, 0), b2_text, font=f_badge)
    b2_w = b2_bbox[2] - b2_bbox[0] + 20
    b2_x = col2_x + col_w - b2_w - 20
    draw.rounded_rectangle([b2_x, branch_y + 22, b2_x + b2_w, branch_y + 54], radius=6, fill="#991B1B", outline="#F87171", width=1)
    draw.text((b2_x + 10, branch_y + 27), b2_text, fill="#FEF08A", font=f_badge)

    col2_items = [
        ("Requisition Triage Queue", "Filter hospital orders by urgency/status, review clinical details, advance 4-stage stepper"),
        ("Inventory Mutation Engine", "Atomic vault mutations (+ Intake, - Dispatch with oversell guard, = Count reconciliation)"),
        ("Voluntary Donor Registry", "Multi-parameter donor directory search, blood phenotype filters, RFC-4180 CSV spreadsheet export"),
        ("Indelible Audit Ledger", "Chronological append-only transaction history, operator signatures, justification tracking"),
        ("Security & Credential Manager", "Active session monitor, instant token revocation on logout, in-app SHA-512 password rotation")
    ]

    trunk2_x = col2_x + 40
    last_card2_y = card_y + (len(col2_items) - 1) * (card_h + gap) + card_h // 2
    draw.line([(col2_x + col_w // 2, branch_y + branch_h), (col2_x + col_w // 2, card_y - 18)], fill="#64748B", width=3)
    draw.line([(col2_x + col_w // 2, card_y - 18), (trunk2_x, card_y - 18)], fill="#64748B", width=3)
    draw.line([(trunk2_x, card_y - 18), (trunk2_x, last_card2_y)], fill="#64748B", width=3)

    for idx, (title, desc) in enumerate(col2_items):
        y = card_y + idx * (card_h + gap)
        draw.line([(trunk2_x, y + card_h // 2), (col2_x + 80, y + card_h // 2)], fill="#64748B", width=3)
        draw.ellipse([trunk2_x - 5, y + card_h // 2 - 5, trunk2_x + 5, y + card_h // 2 + 5], fill="#7F1D1D")

        bx = col2_x + 80
        bw = col_w - 80
        draw.rounded_rectangle([bx + 3, y + 3, bx + bw + 3, y + card_h + 3], radius=10, fill="#E2E8F0")
        draw.rounded_rectangle([bx, y, bx + bw, y + card_h], radius=10, fill="#FFF5F5", outline="#FECACA", width=2)
        
        # Color bar indicator
        draw.rounded_rectangle([bx, y, bx + 8, y + card_h], radius=4, fill="#DC2626")

        # Text
        draw.text((bx + 25, y + 20), f"{idx+1}.  {title}", fill="#7F1D1D", font=f_item_title)
        draw.text((bx + 25, y + 62), desc, fill="#475569", font=f_item_desc)

    # Save image
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Generated high-resolution site navigation tree: {output_path} ({width}x{height})")

if __name__ == "__main__":
    render_navigation_tree()
