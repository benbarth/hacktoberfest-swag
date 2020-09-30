import datetime
import glob
import pathlib
import re
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
__version__ = "1.0.0"
__maintainer__ = "Sascha Greuel"
__email__ = "hello@1-2.dev"
__status__ = "Production"

root = pathlib.Path(__file__).parent.resolve()
currentYear = datetime.datetime.now().strftime("%Y")


def get_participants():
    ret = []

    for file in sorted(glob.glob("participants" + path.sep + "**" + path.sep + "*.yml")):
        with open(file, 'r') as stream:
            try:
                # We assume, that all files in participants/CURRENT_YEAR are "verified"
                if file.startswith("participants" + path.sep + currentYear + path.sep):
                    ret.append({'verified': yaml.safe_load(stream)})
                # Mark all participants from the previous year as "unverified", ignore older files
                elif file.startswith("participants" + path.sep + str((int(currentYear) - 1)) + path.sep):
                    ret.append({'unverified': yaml.safe_load(stream)})
            except yaml.YAMLError as exc:
                msg = 'An error occurred during YAML parsing.'

                if hasattr(exc, 'problem_mark'):
                    msg += ' Error position: (%s:%s)' % (exc.problem_mark.line + 1,
                                                         exc.problem_mark.column + 1)

                raise ValueError(msg)

    return ret


if __name__ == '__main__':
    readme_path = root / 'README.md'
    readme = readme_path.open().read()
    participants = get_participants()

    replacement_v = "| Who / Sponsors | What | How | Additional Details |\n"
    replacement_v += "| :---: | :---: | :---: | --- |\n"
    replacement_v += "| **[DigitalOcean + Sponsors](https://www.digitalocean.com)** | **![Shirt](" \
                     "icons/shirt.png) ![Stickers](icons/stickers.png)** | **Four pull requests to any public " \
                     "repo on GitHub.** | **[Details](https://hacktoberfest.digitalocean.com)** |\n"

    replacement_uv = "| Who / Sponsors | What | How | Additional Details |\n"
    replacement_uv += "| :---: | :---: | :---: | --- |\n"

    for participant in participants:
        if 'verified' in participant:
            participant = participant['verified']

            replacement_v += "| [" + participant['Name'] + "](" + participant['Website'] + ") | "

            for swagItem in sorted(participant['Swag']):
                swagItem = swagItem.lower()

                if path.exists("icons/" + swagItem + ".png"):
                    replacement_v += "![" + swagItem.capitalize() + "](icons/" + swagItem + ".png) "

            replacement_v += "| "
            replacement_v += participant['Description'] \
                                 .rstrip('.').replace("\n", " ").replace("\r", " ").replace("|", "") + " | "
            replacement_v += "[Details](" + participant['Details'] + ") |\n"
        elif 'unverified' in participant:
            participant = participant['unverified']

            replacement_uv += "| [" + participant['Name'] + "](" + participant['Website'] + ") | "

            for swagItem in sorted(participant['Swag']):
                swagItem = swagItem.lower()

                if path.exists("icons/" + swagItem + ".png"):
                    replacement_uv += "![" + swagItem.capitalize() + "](icons/" + swagItem + ".png) "

            replacement_uv += "| "
            replacement_uv += participant['Description'] \
                                  .rstrip('.').replace("\n", " ").replace("\r", " ").replace("|", "") + " | "
            replacement_uv += "[Details](" + participant['Details'] + ") |\n"

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

    year = "<!-- current year start -->{}<!-- current year end -->".format(currentYear)
    readme_contents = r.sub(year, readme_contents)

    # Update README
    readme_path.open('w').write(readme_contents)
