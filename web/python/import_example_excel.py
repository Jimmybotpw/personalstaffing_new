from __future__ import annotations

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
DAY_MAP = {'Mo': 1, 'Di': 2, 'Mi': 3, 'Do': 4, 'Fr': 5, 'Sa': 6, 'So': 7}


def read_rows(path: str):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall(f'{NS}si'):
                shared.append(''.join(t.text or '' for t in si.iter(f'{NS}t')))
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relmap = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels}
        sheet = wb.find(f'{NS}sheets')[0]
        target = 'xl/' + relmap[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        root = ET.fromstring(z.read(target))
        rows = []
        for row in root.iter(f'{NS}row'):
            vals = []
            for c in row.findall(f'{NS}c'):
                t = c.attrib.get('t')
                v = c.find(f'{NS}v')
                val = ''
                if v is not None:
                    val = v.text or ''
                    if t == 's':
                        val = shared[int(val)] if val.isdigit() and int(val) < len(shared) else val
                vals.append(val)
            if any(v != '' for v in vals):
                rows.append(vals)
        return rows


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').strip())


def parse_bool(value: str) -> bool:
    return norm(value).lower() in {'yes', 'y', 'true', '1'}


def time_to_minutes(text: str) -> int:
    h, m = text.strip().split(':')
    return int(h) * 60 + int(m)


def parse_time_ranges(text: str):
    text = text.replace('–', '-').replace(';', ',')
    parts = [norm(p) for p in text.split(',') if norm(p)]
    items = []
    for part in parts:
        m = re.match(r'(Mo|Di|Mi|Do|Fr|Sa|So)\s*:??\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})', part)
        if not m:
            continue
        day, start, end = m.groups()
        items.append({
            'weekday': DAY_MAP[day],
            'startMinutes': time_to_minutes(start),
            'endMinutes': time_to_minutes(end),
        })
    return items


def parse_rows(rows):
    employees = []
    employee_names = rows[1][1:]
    targets = rows[2][1:]
    maxes = rows[3][1:]
    weekends = rows[4][1:]
    openclose = rows[5][1:]
    splitshifts = rows[6][1:]
    fixed_times = rows[7][1:]
    blocked_area_row = rows[8][1:]

    blocked_area = norm(blocked_area_row[0]) if blocked_area_row else ''

    for idx, name in enumerate(employee_names):
        employees.append({
            'name': norm(name),
            'targetHoursWeek': int(float(targets[idx] or 0)),
            'maxHoursWeek': int(float(maxes[idx] or 0)),
            'weekendService': parse_bool(weekends[idx] if idx < len(weekends) else ''),
            'openCloseService': parse_bool(openclose[idx] if idx < len(openclose) else ''),
            'splitService': parse_bool(splitshifts[idx] if idx < len(splitshifts) else ''),
            'fixedTimes': parse_time_ranges(fixed_times[idx] if idx < len(fixed_times) else ''),
            'blockedAreas': [blocked_area] if blocked_area and idx == 0 else [],
        })

    area_names = rows[10][1:]
    area_open = rows[11][1:]
    area_people = rows[12][1:]
    area_min = rows[13][1:]
    area_max = rows[14][1:]
    areas = []
    for idx, name in enumerate(area_names):
        allowed_people = [norm(p) for p in (area_people[idx] if idx < len(area_people) else '').split(',') if norm(p)]
        areas.append({
            'name': norm(name),
            'openingHours': parse_time_ranges(area_open[idx] if idx < len(area_open) else ''),
            'allowedPeople': allowed_people,
            'minStaffDefault': int(float(area_min[idx] or 1)),
            'maxStaffDefault': int(float(area_max[idx])) if idx < len(area_max) and norm(area_max[idx]) else None,
        })

    course_names = rows[16][1:]
    course_owners = rows[17][1:]
    course_times = rows[18][1:]
    courses = []
    for idx, name in enumerate(course_names):
        courses.append({
            'name': norm(name),
            'primaryEmployeeName': norm(course_owners[idx] if idx < len(course_owners) else ''),
            'times': parse_time_ranges(course_times[idx] if idx < len(course_times) else ''),
        })

    return {
        'employees': employees,
        'areas': areas,
        'courses': courses,
        'constraintConfig': {
            'minRestHours': 11,
            'planningGridMinutes': 30,
            'allowSplitShifts': False,
            'maxConsecutiveDays': 6,
            'preferBalancedWeekends': True,
        },
    }


if __name__ == '__main__':
    rows = read_rows(sys.argv[1])
    print(json.dumps(parse_rows(rows), ensure_ascii=False))
