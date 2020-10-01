import datetime
import glob
import os
import re
import shutil
from os import path

import yaml

""" MIT License

Copyright (c) 2020 1-2.dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

__author__ = "Sascha Greuel"
__copyright__ = "Copyright 2020, Sascha Greuel"
__license__ = "MIT"
__maintainer__ = "Sascha Greuel"
__email__ = "hello@1-2.dev"
__status__ = "Production"

root = os.getcwd() + path.sep
current_year = datetime.datetime.now().strftime("%Y")


def init():
    workdir = root + "participants" + path.sep

    # Create participants directory for the current year, if it doesn't exist
    if not path.exists(workdir + current_year):
        os.mkdir(workdir + current_year)
        open(workdir + current_year + path.sep + ".gitkeep", "a").close()

    # Remove obsolete directories and files
    for directory in glob.glob(workdir + "*"):
        if int(path.basename(directory)) < (int(current_year) - 1):
            shutil.rmtree(directory)


def read_blocklist():
    entries = []

    with open(root + ".gitignore") as blocklist:
        add_entry = False

        for line in blocklist:
            if line.strip() == "# Blocklist start":
                add_entry = True
                continue
            elif line.strip() == "# Blocklist end":
                add_entry = False
                continue
            elif add_entry:
                entries.append(line.strip().replace("*", "").lower())

    return entries


def get_participants():
    blocklist = read_blocklist()
    last_year = str((int(current_year) - 1))
    ret = []

    for file in sorted(glob.glob(root + "participants" + path.sep + "**" + path.sep + "*.yml")):
        with open(file, "r") as stream:
            try:
                data = yaml.safe_load(stream)

                # Do not add blocked participants
                if path.basename(file).lower() in blocklist or data["Name"].replace(" ", "").lower() in blocklist:
                    # Delete PARTICIPANT.yml, because it"s blocked in /.gitignore
                    if path.isfile(file):
                        os.remove(file)

                    continue

                # We assume, that all files in participants/CURRENT_YEAR are "verified"
                if file.startswith(root + "participants" + path.sep + current_year + path.sep):
                    if "IsSponsor" in data and data["IsSponsor"] is True:
                        ret.append({"sponsor": data})
                    else:
                        ret.append({"verified": data})

                    # Remove participant from the list of unverified / past participants
                    old_file = "participants" + path.sep + last_year + path.sep + path.basename(file)

                    # Delete PARTICIPANT.yml from the LAST_YEAR directory, if it exists
                    if path.isfile(old_file):
                        os.remove(old_file)

                # Mark all participants from the previous year as "unverified", ignore older files
                elif file.startswith(root + "participants" + path.sep + last_year + path.sep):
                    ret.append({"unverified": data})
            except yaml.YAMLError as exc:
                msg = "An error occurred during YAML parsing."

                if hasattr(exc, "problem_mark"):
                    msg += " Error position: (%s:%s)" % (exc.problem_mark.line + 1,
                                                         exc.problem_mark.column + 1)

                raise ValueError(msg)

    return ret


def build_row(data):
    row = "| [" + data["Name"] + "](" + data["Website"] + ") | "

    for swag_item in sorted(data["Swag"]):
        swag_item = swag_item.lower()

        if path.exists(root + "icons" + path.sep + swag_item + ".png"):
            row += "![" + swag_item.capitalize() + "](icons/" + swag_item + ".png) "

    row += "| "
    row += data["Description"].rstrip(".").replace("\n", " ").replace("\r", " ").replace("|", "") + " | "
    row += "[Details](" + data["Details"] + ") |\n"

    return row


if __name__ == "__main__":
    init()

    readme_path = root + "README.md"
    readme = open(readme_path, "r").read()
    participants = get_participants()

    # Sponsors & Verified participants
    replacement_v = ""
    replacement_s = "| Who / Sponsors | What | How | Additional Details |\n"
    replacement_s += "| :---: | :---: | :---: | --- |\n"
    replacement_s += "| **[DigitalOcean + Sponsors](https://www.digitalocean.com)** | **![Shirt](" \
                     "icons/shirt.png) ![Stickers](icons/stickers.png)** | **Four pull requests to any public " \
                     "repo on GitHub.** | **[Details](https://hacktoberfest.digitalocean.com)** |\n"

    # Unverified / Past participants
    replacement_uv = "| Who / Sponsors | What | How | Additional Details |\n"
    replacement_uv += "| :---: | :---: | :---: | --- |\n"

    for participant in participants:
        if "sponsor" in participant:
            replacement_s += build_row(participant["sponsor"])
        elif "verified" in participant:
            replacement_v += build_row(participant["verified"])
        elif "unverified" in participant:
            replacement_uv += build_row(participant["unverified"])

    # Sponsors = Verified (but on top of the list)
    replacement_v = replacement_s + replacement_v

    # Inject verified participants into README
    r = re.compile(
        r"<!-- verified start -->.*<!-- verified end -->".format(),
        re.DOTALL,
    )

    replacement_v = "<!-- verified start -->\n{}<!-- verified end -->".format(replacement_v)
    readme_contents = r.sub(replacement_v, readme)

    # Inject unverified participants into README
    r = re.compile(
        r"<!-- unverified start -->.*<!-- unverified end -->".format(),
        re.DOTALL,
    )

    replacement_uv = "<!-- unverified start -->\n{}<!-- unverified end -->".format(replacement_uv)
    readme_contents = r.sub(replacement_uv, readme_contents)

    # Inject current year into README
    r = re.compile(
        r"<!-- current year start -->(202[0-9])?<!-- current year end -->".format(),
        re.DOTALL,
    )

    year = "<!-- current year start -->{}<!-- current year end -->".format(current_year)
    readme_contents = r.sub(year, readme_contents)

    # Normalize line breaks in README
    readme_contents = readme_contents.replace("\r\n", "\n").replace("\r", "\n")

    # Update README
    open(readme_path, "w").write(readme_contents)
