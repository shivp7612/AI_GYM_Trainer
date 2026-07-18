# backend/ai_logic/report_generator.py
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from typing import Dict, List, Any
import datetime

def generate_pdf_report(user_name: str, profile_goal: str, session: Dict[str, Any], exercises: List[Dict[str, Any]], file_path: str):
    """
    Generates a structured, professional PDF report of a user's workout session.
    session: Dict containing 'duration', 'calories_burned', 'avg_accuracy', 'avg_fatigue', 'risk_level'
    exercises: List of dicts, each containing 'exercise', 'reps', 'sets', 'accuracy', 'risk'
    """
    doc = SimpleDocTemplate(file_path, pagesize=letter,
                            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    primary_color = colors.HexColor("#3F51B5") # Deep Indigo
    secondary_color = colors.HexColor("#E0F2F1") # Mint highlight
    text_color = colors.HexColor("#212121") # Dark grey
    grey_color = colors.HexColor("#757575")
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=primary_color,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        textColor=grey_color,
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=primary_color,
        spaceAfter=10,
        spaceBefore=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        textColor=text_color,
        leading=14
    )

    alert_style = ParagraphStyle(
        'AlertText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        textColor=colors.HexColor("#D32F2F"), # Red warning
        leading=14
    )

    header_cell_style = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white
    )

    body_cell_style = ParagraphStyle(
        'BodyCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=text_color
    )

    elements = []
    
    # Title & Metadata
    elements.append(Paragraph("AI GYM TRAINER", title_style))
    elements.append(Paragraph(f"Workout Session Report & Posture Analysis | Generated on {datetime.date.today().strftime('%B %d, %Y')}", subtitle_style))
    
    # Profile Info Block
    profile_data = [
        [Paragraph(f"<b>Athlete:</b> {user_name}", body_style), Paragraph(f"<b>Primary Goal:</b> {profile_goal}", body_style)],
        [Paragraph(f"<b>Session Duration:</b> {session['duration']} mins", body_style), Paragraph(f"<b>Calories Burned:</b> {int(session['calories_burned'])} kcal", body_style)]
    ]
    
    profile_table = Table(profile_data, colWidths=[260, 260])
    profile_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), secondary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, primary_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#B2DFDB")),
    ]))
    
    elements.append(profile_table)
    elements.append(Spacer(1, 15))
    
    # Metrics Summary Section
    elements.append(Paragraph("AI Performance Summary", section_title_style))
    
    accuracy_eval = "Excellent form! Your joints were stable and path of motion was perfect." if session['avg_accuracy'] >= 85 else (
        "Good effort. Focus on controlled motion to keep alignment stable." if session['avg_accuracy'] >= 70 else
        "Form adjustments needed. Check tutorials and lower weight to protect your joints."
    )

    summary_text = (
        f"During this {session['duration']}-minute session, your average posture form accuracy was <b>{session['avg_accuracy']}%</b>. "
        f"Your peak fatigue index reached <b>{session['avg_fatigue']}%</b>, indicating a {session['risk_level'].lower()} injury risk profile. <br/><br/>"
        f"<b>Coach Feedback:</b> {accuracy_eval}"
    )
    elements.append(Paragraph(summary_text, body_style))
    elements.append(Spacer(1, 15))
    
    # Detailed Exercises Table
    elements.append(Paragraph("Exercise Execution Details", section_title_style))
    
    table_data = [[
        Paragraph("Exercise", header_cell_style), 
        Paragraph("Sets", header_cell_style), 
        Paragraph("Reps", header_cell_style), 
        Paragraph("Form Accuracy", header_cell_style), 
        Paragraph("Injury Risk", header_cell_style)
    ]]
    
    worst_ex = None
    worst_acc = 101.0
    best_ex = None
    best_acc = -1.0
    
    for item in exercises:
        ex_name = item['exercise'].replace("_", " ").title()
        table_data.append([
            Paragraph(ex_name, body_cell_style),
            Paragraph(str(item['sets']), body_cell_style),
            Paragraph(str(item['reps']), body_cell_style),
            Paragraph(f"{item['accuracy']}%", body_cell_style),
            Paragraph(item['risk'], body_cell_style)
        ])
        
        if item['accuracy'] < worst_acc:
            worst_acc = item['accuracy']
            worst_ex = ex_name
        if item['accuracy'] > best_acc:
            best_acc = item['accuracy']
            best_ex = ex_name
            
    ex_table = Table(table_data, colWidths=[200, 50, 50, 110, 110])
    ex_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F5F5F5")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E0E0E0")),
    ]))
    
    elements.append(ex_table)
    elements.append(Spacer(1, 15))
    
    # Form Correction Recommendations
    elements.append(Paragraph("Posture Correction & Safety Recommendations", section_title_style))
    
    recom_list = []
    
    if worst_acc < 80.0:
        recom_list.append(Paragraph(f"⚠️ <b>Focus Area ({worst_ex}):</b> Your form slipped to {int(worst_acc)}%. Keep your joints locked and prioritize core bracing to stabilize posture.", alert_style))
    else:
        recom_list.append(Paragraph(f"✅ <b>Form Highlight:</b> Excellent joint control on all exercises. Your best exercise was {best_ex} with {int(best_acc)}% form accuracy.", body_style))
        
    # Standard recommendations based on injuries or low posture scores
    recom_list.append(Paragraph("💡 <b>Squats/Lunges Tips:</b> Always keep your back straight and hinge backward from the hips first. Prevent knees from caving inwards.", body_style))
    recom_list.append(Paragraph("💡 <b>Pushing Movements Tips:</b> Tuck your elbows to a 45-degree angle. Flaring elbows puts high compressive stress on the shoulder cuffs.", body_style))
    recom_list.append(Paragraph("💡 <b>Hydration Reminder:</b> You have generated high physical output. Drink 300ml of water and consume adequate protein to speed muscle repair.", body_style))

    # Add recommendations list
    for rec in recom_list:
        elements.append(rec)
        elements.append(Spacer(1, 8))
        
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("<i>End of Report. Keep up the consistent effort!</i>", subtitle_style))
    
    # Build Document
    doc.build(elements)
