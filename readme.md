# release-with-changelog

<img src="./media/releases.png" align="right" width="400">

Creates reasonable enough GitHub releases for pushed tags, with the commit log as release body.

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

- `header`: Content to prepend at the start of release notes. Default: `''`.
- `footer`: Content to append at the end of release notes. Default: `''`.
- `include-hash`: Prepend and link commit hash to each entry. Default: `false`.
- `include-range`: Adds a compare link between tags at end of release roles. Default: `true`.
- `tag`: Specific tag to generate changelog against. Default: _latest tag available_.
- `token`: [Personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) used to create releases.

## Outputs

None.

## License

[MIT](./license)
