"""
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

import datetime
import glob
import os
import re
import shutil
from typing import Dict, List

import yaml

__author__ = "Sascha Greuel"
__copyright__ = "Copyright 2020, Sascha Greuel"
__license__ = "MIT"
__maintainer__ = "Sascha Greuel"
__email__ = "hello@1-2.dev"
__status__ = "Production"

root = os.getcwd() + os.path.sep
current_year = datetime.datetime.now().strftime("%Y")


def init() -> None:
    """ Performs some cleanup tasks on execution """
    work_dir = root + "participants" + os.path.sep

    # Create participants directory for the current year, if it doesn't exist
    if not os.path.exists(work_dir + current_year):
        os.mkdir(work_dir + current_year)
        open(work_dir + current_year + os.path.sep + ".gitkeep", "a").close()

    # Remove obsolete directories and files
    for directory in glob.glob(work_dir + "*"):
        # if os.path.isdir(directory) and int(os.path.basename(directory)) < (int(current_year) - 1):
        if os.path.isdir(directory) and int(os.path.basename(directory)) < (int(current_year)):
            shutil.rmtree(directory)


def read_blocklist() -> List:
    """ Returns a list of blocked participants """
    entries = []

    with open(root + ".gitignore") as blocklist:
        add_entry = False

        for line in blocklist:
            if line.strip() == "# Blocklist start":
                add_entry = True
            elif line.strip() == "# Blocklist end":
                add_entry = False
                continue
            elif add_entry:
                entries.append(line.strip().replace("*", "").casefold())

    return entries


def get_participants() -> List[Dict]:
    """ Returns a sorted list of verified and unverified participants and sponsors """
    work_dir = root + "participants" + os.path.sep
    blocklist = read_blocklist()
    last_year = str((int(current_year) - 1))
    ret = []

    # Treat hacktoberfest.yml in the participants directory separately
    with open(work_dir + "hacktoberfest.yml", "r") as stream:
        ret.append({"sponsor": yaml.safe_load(stream)})

    for file in sorted(glob.glob(work_dir + "**" + os.path.sep + "*.yml"), key=str.casefold):
        with open(file, "r") as stream:
            try:
                data = yaml.safe_load(stream)
                basename = os.path.basename(file)

                # Do not add blocked participants
                if basename.casefold() in blocklist:
                    # Delete PARTICIPANT.yml, because it"s blocked in /.gitignore
                    if os.path.isfile(file):
                        os.remove(file)

                    continue

                # We assume, that all files in participants/CURRENT_YEAR are "verified"
                if file.startswith(work_dir + current_year + os.path.sep):
                    if "IsSponsor" in data and data["IsSponsor"] is True:
                        ret.append({"sponsor": data})
                    else:
                        ret.append({"verified": data})

                    # Remove participant from the list of unverified / past participants
                    old_file = work_dir + last_year + os.path.sep + basename

                    # Delete PARTICIPANT.yml from the LAST_YEAR directory, if it exists
                    if os.path.isfile(old_file):
                        os.remove(old_file)

                # Mark all participants from the previous year as "unverified", ignore older files
                elif file.startswith(work_dir + last_year + os.path.sep):
                    ret.append({"unverified": data})
            except yaml.MarkedYAMLError as exc:
                msg = "An error occurred during YAML parsing."

                if hasattr(exc, "problem_mark"):
                    msg += " Error position: (%s:%s)" % (exc.problem_mark.line + 1, exc.problem_mark.column + 1)

                raise ValueError(msg) from exc

    return ret


def build_row(data: Dict) -> str:
    """ Returns a markdown formatted table row for a given participant """
    row = "| [" + data["Name"] + "](" + data["Website"] + ") | "

    for swag_item in sorted(data["Swag"]):
        swag_item = swag_item.casefold()

        # convert synonyms
        if swag_item == "tshirt" or swag_item == "t-shirt" or swag_item == "teeshirt" or swag_item == "tee-shirt":
            swag_item = "shirt"
        elif swag_item == "sticker":
            swag_item = "stickers"
        elif swag_item == "face-mask" or swag_item == "face mask" or swag_item == "facemask":
            swag_item = "mask"
        elif swag_item == "tree" or swag_item == "trees" or swag_item == "plant tree" or swag_item == "plant trees":
            swag_item = "plant"

        if os.path.exists(root + "icons" + os.path.sep + swag_item + ".png"):
            row += "![" + swag_item.capitalize() + "](icons/" + swag_item + ".png) "

    row += "| "
    row += "<details><summary>How to contribute?</summary>" + data["Description"].replace("\n", " ").replace("\r", " ").replace("|", "") + "</details> | "
    row += "[More Details here](" + data["Details"] + ") |\n"

    return row


if __name__ == "__main__":
    init()

    readme_path = root + "README.md"
    readme = open(readme_path, "r").read()
    participants = get_participants()

    # Sponsors & Verified participants
    replacement_v = "| | | | |\n"

    replacement_s = "| Who | What | How | Additional Details |\n"
    replacement_s += "| :---: | :---: | --- | --- |\n"

    # Unverified / Past participants
    replacement_uv = "| Who | What | How | Additional Details |\n"
    replacement_uv += "| :---: | :---: | --- | --- |\n"

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
        r"<!-- current year start -->([0-9]+)?<!-- current year end -->".format(),
        re.DOTALL,
    )

    replacement_y = "<!-- current year start -->{}<!-- current year end -->".format(current_year)
    readme_contents = r.sub(replacement_y, readme_contents)

    # Normalize line breaks in README
    readme_contents = readme_contents.replace("\r\n", "\n").replace("\r", "\n")

    # Update README
    open(readme_path, "w").write(readme_contents)
