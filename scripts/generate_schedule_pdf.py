#!/usr/bin/env python3
"""
Script de génération de PDF pour les emplois du temps INTELLECTION CLASSBOARD
Usage: python generate_schedule_pdf.py --type [branch|professor] --data data.json --output emploi.pdf
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import json
import argparse
import sys

# Jours de la semaine
DAYS_OF_WEEK = {
    0: 'Dimanche',
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi'
}

def create_schedule_pdf(data, output_file):
    """
    Génère un PDF d'emploi du temps
    
    Args:
        data: dict contenant les données de l'emploi du temps
        output_file: chemin du fichier PDF à générer
    """
    # Créer le document en paysage pour plus d'espace
    doc = SimpleDocTemplate(
        output_file,
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    day_header_style = ParagraphStyle(
        'DayHeader',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.white,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    # Éléments du document
    story = []
    
    # En-tête
    story.append(Paragraph("INTELLECTION CLASSBOARD", title_style))
    
    if data.get('type') == 'branch':
        story.append(Paragraph(f"Emploi du temps - {data.get('branch', '')}", subtitle_style))
    elif data.get('type') == 'professor':
        story.append(Paragraph(f"Emploi du temps - Professeur {data.get('professor', '')}", subtitle_style))
    
    story.append(Paragraph(
        f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
        subtitle_style
    ))
    
    story.append(Spacer(1, 0.5*cm))
    
    # Organiser les séances par jour
    sessions_by_day = {}
    for session in data.get('sessions', []):
        day = session.get('dayOfWeek', 0)
        if day not in sessions_by_day:
            sessions_by_day[day] = []
        sessions_by_day[day].append(session)
    
    # Trier chaque jour par heure
    for day in sessions_by_day:
        sessions_by_day[day].sort(key=lambda x: x.get('startTime', '00:00'))
    
    # Générer une section par jour
    for day_num in sorted(sessions_by_day.keys()):
        day_name = DAYS_OF_WEEK.get(day_num, f'Jour {day_num}')
        sessions = sessions_by_day[day_num]
        
        # En-tête du jour
        day_table = Table(
            [[Paragraph(day_name, day_header_style)]],
            colWidths=[26*cm]
        )
        day_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(day_table)
        story.append(Spacer(1, 0.2*cm))
        
        # Tableau des séances
        table_data = []
        
        # En-têtes
        if data.get('type') == 'professor':
            headers = ['Horaire', 'Filiale', 'Niveau', 'Matière', 'Salle', 'Statut']
            col_widths = [3.5*cm, 4*cm, 4*cm, 6*cm, 2.5*cm, 3*cm]
        else:
            headers = ['Horaire', 'Niveau', 'Matière', 'Professeur', 'Salle', 'Statut']
            col_widths = [3.5*cm, 4*cm, 6*cm, 5*cm, 2.5*cm, 3*cm]
        
        table_data.append(headers)
        
        # Séances
        for session in sessions:
            horaire = f"{session.get('startTime', '')} - {session.get('endTime', '')}"
            niveau = session.get('level', '')
            matiere = session.get('subject', '')
            prof = session.get('professor', '')
            salle = session.get('room', '')
            
            # Statut
            status = session.get('status', 'normal')
            if status == 'cancelled':
                statut = 'ANNULÉE'
            elif status == 'delayed':
                statut = 'RETARDÉE'
            elif status == 'absent':
                statut = 'ABSENT'
            else:
                statut = 'Prévu'
            
            if data.get('type') == 'professor':
                filiale = session.get('branch', '')
                row = [horaire, filiale, niveau, matiere, salle, statut]
            else:
                row = [horaire, niveau, matiere, prof, salle, statut]
            
            table_data.append(row)
        
        # Créer le tableau
        session_table = Table(table_data, colWidths=col_widths)
        
        # Style du tableau
        table_style = TableStyle([
            # En-tête
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            
            # Corps
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('LEFTPADDING', (0, 1), (-1, -1), 6),
            ('RIGHTPADDING', (0, 1), (-1, -1), 6),
            
            # Grille
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2563eb')),
            
            # Alternance de couleurs
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            
            # Alignement de la salle (centré)
            ('ALIGN', (4, 1), (4, -1), 'CENTER'),
            ('FONTNAME', (4, 1), (4, -1), 'Helvetica-Bold'),
            
            # Statut (centré et en gras)
            ('ALIGN', (5, 1), (5, -1), 'CENTER'),
            ('FONTNAME', (5, 1), (5, -1), 'Helvetica-Bold'),
        ])
        
        session_table.setStyle(table_style)
        story.append(session_table)
        story.append(Spacer(1, 0.5*cm))
    
    # Pied de page
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )
    story.append(Paragraph("INTELLECTION CLASSBOARD - www.intellection.ma", footer_style))
    story.append(Paragraph("Pour toute modification, contactez l'administration", footer_style))
    
    # Construire le PDF
    doc.build(story)
    print(f"✅ PDF généré avec succès: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Générer un PDF d\'emploi du temps')
    parser.add_argument('--data', required=True, help='Fichier JSON contenant les données')
    parser.add_argument('--output', required=True, help='Fichier PDF de sortie')
    
    args = parser.parse_args()
    
    try:
        # Lire les données JSON
        with open(args.data, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Générer le PDF
        create_schedule_pdf(data, args.output)
        
    except FileNotFoundError:
        print(f"❌ Erreur: Fichier {args.data} introuvable", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"❌ Erreur: Format JSON invalide dans {args.data}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
