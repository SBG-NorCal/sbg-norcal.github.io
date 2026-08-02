#!/usr/bin/env python3
"""Validate _data/schedule.yml.

Run this after any schedule edit:

    pip install pyyaml
    python tests/crosscheck_schedule.py

Checks:
  * No classes before 09:00 — catches a PM class typed as AM ("06:30" for
    6:30 pm), which is how the site once grew phantom duplicate classes.
  * No duplicate (day, program, level).
  * Foundations BJJ ends 19:45; Integrations BJJ ends 20:45.
  * Class durations are consistent with the gym's standard lengths.
  * Every `program:` slug resolves to a file in _programs/.
  * Start times come before end times.
"""
import glob
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("Missing dep. Run:  pip install pyyaml")

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YML = os.path.join(REPO, "_data", "schedule.yml")

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"]

# Standard class lengths, in minutes, keyed by the `level` label.
# A class whose duration doesn't match its type is usually a typo.
EXPECTED_MINUTES = {
    "Foundations": 75,
    "Integrations": 75,
    "Explorers (Youth BJJ)": 60,
    "Teen/Tween (Teen BJJ)": 60,
    "Kettlebell 101/201": 60,
    "Starting Strength Circuit": 60,
    "Pillars": 45,                    # Boxing Boot Camp
    "Women's Self-Defense": 45,
    "Leadership (Youth BJJ)": 30,
    "Sticky Monkey": 30,
}


def to_minutes(hhmm):
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def main():
    data = yaml.safe_load(open(YML))
    classes = data["classes"]
    fails = []

    progs = {os.path.basename(p)[:-3]
             for p in glob.glob(os.path.join(REPO, "_programs", "*.md"))}

    for c in classes:
        where = f"{c['day']} {c['start']}-{c['end']} {c['program']}/{c['level']}"

        if c["day"] not in DAYS:
            fails.append(f"{where}: unknown day {c['day']!r}")

        if c["program"] not in progs:
            fails.append(f"{where}: unknown program slug {c['program']!r}")

        start, end = to_minutes(c["start"]), to_minutes(c["end"])
        if end <= start:
            fails.append(f"{where}: end is not after start")

        # The AM/PM bug. Nothing at this gym runs before 09:30.
        if c["start"] < "09:00":
            fails.append(f"{where}: starts before 09:00 — AM/PM mix-up? "
                         f"(6:30 pm is '18:30', not '06:30')")

        want = EXPECTED_MINUTES.get(c["level"])
        if want and (end - start) != want:
            fails.append(f"{where}: runs {end - start} min, expected {want}")

        if c["program"] == "brazilian-jiu-jitsu" and c["day"] != "Saturday":
            if c["level"] == "Foundations" and c["end"] != "19:45":
                fails.append(f"{where}: Foundations BJJ should end 19:45")
            if c["level"] == "Integrations" and c["end"] != "20:45":
                fails.append(f"{where}: Integrations BJJ should end 20:45")

    seen = {}
    for c in classes:
        seen.setdefault((c["day"], c["program"], c["level"]), []).append(c["start"])
    for key, starts in seen.items():
        if len(starts) > 1:
            fails.append(f"duplicate class {key} at {starts}")

    # ---- report ----------------------------------------------------------
    by_day = {d: [] for d in DAYS}
    for c in classes:
        by_day.setdefault(c["day"], []).append(c)
    for day in DAYS:
        entries = sorted(by_day.get(day, []), key=lambda c: c["start"])
        if not entries:
            continue
        print(f"{day}")
        for c in entries:
            dur = to_minutes(c["end"]) - to_minutes(c["start"])
            print(f"  {c['start']}-{c['end']}  ({dur:>3} min)  "
                  f"{c['program']:<20} {c['level']}")

    print(f"\n{len(classes)} classes across "
          f"{len([d for d in DAYS if by_day.get(d)])} days")

    print("\n=== result ===")
    if fails:
        print("FAIL")
        for f in fails:
            print("  -", f)
        return 1
    print("PASS — schedule.yml is valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
