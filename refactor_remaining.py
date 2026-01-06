
import os

file_path = 'f:/geeoo/geo-linguistic-survey-project/src/GeoLinguisticSurvey.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def dedent(block):
    dedented = []
    for line in block:
        if line.startswith('  '):
            dedented.append(line[2:])
        else:
            dedented.append(line)
    return dedented

# 1. Extract Sections
# FormCSection: 2611-2777 (0-indexed: 2610-2777)
# OpenEndedSection: 2780-2939 (0-indexed: 2779-2939)
# WordListSection: 2942-3156 (0-indexed: 2941-3156)

start_c = 2610
end_c = 2777
form_c_block = lines[start_c:end_c+1]

start_oe = 2779
end_oe = 2939
open_ended_block = lines[start_oe:end_oe+1]

start_wl = 2941
end_wl = 3156
word_list_block = lines[start_wl:end_wl+1]

# Hoist points
# I'll put them after FormBSection (which was inserted at 237)
# FormBSection and ParticipantSection took ~430 lines combined in previous extraction.
# FormASection was already there.
# I'll just find where FormASection is now and put them after it.

# Deducting blocks from original lines
# Note: I must do this from end to start to preserve indices
remaining_lines = lines[:start_c] + lines[start_wl+1:] # Removes C, OE, WL blocks. Wait, indices are tricky.
# Let's do it cleanly:
new_remaining = lines[:start_c] + lines[end_c+1:start_oe] + lines[end_oe+1:start_wl] + lines[end_wl+1:]

# Process FormCSection
dedented_c = dedent(form_c_block)
dedented_c[0] = dedented_c[0].replace('const FormCSection = () => {', 'const FormCSection = ({ surveyData, setSurveyData, setFormCComplete, setCurrentSection }) => {')

# Process OpenEndedSection
dedented_oe = dedent(open_ended_block)
dedented_oe[0] = dedented_oe[0].replace('const OpenEndedSection = () => {', 'const OpenEndedSection = ({ surveyData, setSurveyData, setCurrentSection }) => {')

# Process WordListSection
dedented_wl = dedent(word_list_block)
dedented_wl[0] = dedented_wl[0].replace('const WordListSection = () => {', 'const WordListSection = ({ surveyData, setSurveyData, setFormAComplete, setFormBComplete, setFormCComplete, setCurrentSection, completeSurvey }) => {')

# Assemble hoisted blocks
hoisted_content = dedented_c + ['\n'] + dedented_oe + ['\n'] + dedented_wl + ['\n']

# find insertion point (after FormASection)
insert_pos = 0
for i, line in enumerate(new_remaining):
    if 'const FormASection =' in line:
        insert_pos = i
        break

# Actually insert at the beginning of form field helpers area or similar
# Let's just use 237 again (it was safe before).
insert_pos = 237
final_lines = new_remaining[:insert_pos] + hoisted_content + new_remaining[insert_pos:]

# Update usage
replacements = {
    "{currentSection === 'formC' && <FormCSection />}": "{currentSection === 'formC' && <FormCSection surveyData={surveyData} setSurveyData={setSurveyData} setFormCComplete={setFormCComplete} setCurrentSection={setCurrentSection} />}",
    "{currentSection === 'openEnded' && <OpenEndedSection />}": "{currentSection === 'openEnded' && <OpenEndedSection surveyData={surveyData} setSurveyData={setSurveyData} setCurrentSection={setCurrentSection} />}",
    "{currentSection === 'wordList' && <WordListSection />}": "{currentSection === 'wordList' && <WordListSection surveyData={surveyData} setSurveyData={setSurveyData} setFormAComplete={setFormAComplete} setFormBComplete={setFormBComplete} setFormCComplete={setFormCComplete} setCurrentSection={setCurrentSection} completeSurvey={completeSurvey} />}"
}

updated_final_lines = []
for line in final_lines:
    found = False
    for old, new in replacements.items():
        if old in line:
            updated_final_lines.append(line.replace(old, new))
            found = True
            break
    if not found:
        updated_final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(updated_final_lines)

print("Successfully refactored remaining sections.")
