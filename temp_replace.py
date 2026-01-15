import re

with open('formations-ia.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern pour trouver le paragraphe et le remplacer par une liste
old_text = '''        <p class="paragraph-3">
          En France, 10% des entreprises de 10 salariés ou plus déclarent utiliser l'IA (2024) : l'écart compétences/usage se creuse.

          78% des utilisateurs IA amènent leurs propres outils au travail (BYOAI) : sans cadre, c'est risqué.
          
          AI Act : mesures attendues pour assurer un niveau suffisant de "AI literacy" des équipes.
        </p>'''

new_text = '''        <ul style="list-style: disc; padding-left: 1.2rem;">
          <li class="paragraph-3">En France, 10% des entreprises de 10 salariés ou plus déclarent utiliser l'IA (2024) : l'écart compétences/usage se creuse.</li>
          <li class="paragraph-3">78% des utilisateurs IA amènent leurs propres outils au travail (BYOAI) : sans cadre, c'est risqué.</li>
          <li class="paragraph-3">AI Act : mesures attendues pour assurer un niveau suffisant de "AI literacy" des équipes.</li>
        </ul>'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open('formations-ia.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Remplacement effectué avec succès')
else:
    print('Texte non trouvé exactement. Tentative avec regex...')
    # Essayer avec regex plus flexible
    pattern = r'<p class="paragraph-3">\s*En France, 10%[^<]*</p>'
    # Mais c'est trop complexe, essayons ligne par ligne
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        if '<p class="paragraph-3">' in lines[i] and 'En France, 10%' in lines[i+1]:
            # Trouvé le début, remplacer
            new_lines.append('        <ul style="list-style: disc; padding-left: 1.2rem;">')
            new_lines.append('          <li class="paragraph-3">En France, 10% des entreprises de 10 salariés ou plus déclarent utiliser l\'IA (2024) : l\'écart compétences/usage se creuse.</li>')
            new_lines.append('          <li class="paragraph-3">78% des utilisateurs IA amènent leurs propres outils au travail (BYOAI) : sans cadre, c\'est risqué.</li>')
            new_lines.append('          <li class="paragraph-3">AI Act : mesures attendues pour assurer un niveau suffisant de "AI literacy" des équipes.</li>')
            new_lines.append('        </ul>')
            # Sauter les lignes jusqu'à </p>
            while i < len(lines) and '</p>' not in lines[i]:
                i += 1
            i += 1
        else:
            new_lines.append(lines[i])
            i += 1
    
    content = '\n'.join(new_lines)
    with open('formations-ia.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Remplacement effectué avec regex')
