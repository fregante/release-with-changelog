# release-with-changelog

<img src="./media/releases.png" align="right" width="400">

Creates reasonable enough GitHub releases for pushed tags, with the commit log as release body.

The action also has customizable release body, that support markdown, and template fields. See [template](#template) option to see how that works.

By no means is this an action with extensive configurable options except for the ones already provided. But I would love to add some more in the future.

## Usage

``` yml
jobs:
  Release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        fetch-depth: 100
    - uses: notlmn/release-with-changelog@v2
      with:
        header: '### Changelog'
        footer: 'Custom footer'
        include-hash: true
        include-range: true
        token: ${{ secrets.GITHUB_TOKEN }}
```

### Clone depth

The action expects you to do a deep clone of the repository using `actions/checkout@v2` in order to get historical commits. You can use `fetch-depth: 0` for `actions/checkout` action to clone entire repository or have a reasonable number like `100` to fetch the last 100 commits.

## Inputs

### token

Required: [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) used to create releases.

### template

Default:
``` yml
{commits}

{range}
```

Markdown template to be included in release notes. Available replacements:

- `{commits}` List of commits for this release, see [`commit-template`](#commit-template) below for format of each entry.
- `{range}` A link to diff on GitHub between the last and current release.

### commit-template

Default: `'- {hash} {title}'`

Markdown template for each commit entry in release notes. Available replacements:

- `{title}` A single line title of the commit.
- `{hash}` Abbreviated commit hash, gets linkified automatically in release notes.
- `{url}` Plain link to commit on GitHub.

### exclude

Default: `''` <br>
Example: `'^Meta:'`

Regex to exclude commits based on their title (don't include the initial and final `/`).

### tag

Default: _latest tag available_

Specific tag to generate changelog against.

## Outputs

None.

## License

[MIT](./license)
