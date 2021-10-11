# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue before submitting a pull request.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Pull Request Process

Most parts of the README.md are generated automatically. To add or update participants, please refer to the participants directory.

### Making changes

#### Adding a new participant

Adding a new participant for the current year's Hacktoberfest event is easy as 1-2-3.

Simply create a file named after the participant (e.g. `digitalocean.yml`) and put it in `/participants/CURRENT_YEAR/` and provide all required information as explained [here](#participant-file).

Before creating a new file, you may check first, if it doesn't already exist the directory `/participants/LAST_YEAR/`. If it does, please move it to `/participants/CURRENT_YEAR/` and edit it instead.

Please refrain from editing the file README.md directly, in order to add new participants, as your changes would be overwritten during the next automatic update.

### Publishing your changes

To publish your changes, [create a pull request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request). If all tests pass and the PR gets merged, your changes will be live for everyone to see.

If your changes affect the README in any way, they will be automatically deployed to <https://benbarth.github.io/hacktoberfest-swag>

Every legit pull request made between Oct 01 and Oct 31 also counts towards your contributions goal at <https://hacktoberfest.digitalocean.com/profile>, and may reward you with a ![Shirt](icons/shirt.png) and some ![Stickers](icons/stickers.png). 

---

#### Participant file

Every participant file (`.yml`) will be automatically validated in two steps upon your PR:

1. Validate file(s) against the [schema file](.jsonschema)
2. Validate link(s) within the file(s) using [awesome_bot](https://github.com/dkhamsing/awesome_bot)

If all checks have passed, your PR is ready to be merged. Otherwise, you need to make sure, that the file(s) provided follow the required schema (see example below) and that all URLs provided are valid.

__Example File__

> `participants/2020/acme.yml`
> ```yaml
> ---
> 
> # Name of the participant
> Name: Acme Corporation
> 
> # Website URL of the participant
> Website: https://acme.corp
> 
> # List of obtainable swag. Allowed values are
> # glasses, laptop, mug, shirt, socks, stickers, swag, trees
> Swag:
>   - stickers
>   - shirt
> 
> # Description of the participation (aka "How to get swag?")
> Description: Create one or more merged pull requests.
> 
> # URL of a details page
> Details: https://blog.acme.corp/hacktoberfest/
>
> # Optional flag for sponsors
> IsSponsor: False
> ```
