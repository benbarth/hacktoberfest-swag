# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Pull Request Process

TBA

--

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
> # glasses, laptop, mug, shirt, socks, stickers, swag
> Swag:
>   - stickers
>   - shirt
> 
> # Description of the participation (aka "How to get swag?")
> Description: Create one or more merged pull requests.
> 
> # URL of a details page
> Details: https://blog.acme.corp/hacktoberfest/
> ```
