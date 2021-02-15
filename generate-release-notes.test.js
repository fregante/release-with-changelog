const childProcess = require('child_process');
const stripIndent = require('strip-indent');
const {generateReleaseNotes} = require('./generate-release-notes');

const dedent = string => stripIndent(string).trim();
const range = '1234abcd..1234abcd';

jest.mock('child_process');
childProcess.execFile.mockImplementation((file, args, callback) => callback('', {
	stdout: dedent(`
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-10-07¬Update dependencies (#14)
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-10-06¬Enable \`bypass-checks\` on more commit statuses (#3610)
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-10-05¬Add tooltip to \`table-input\` button (#3615)
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-10-04¬Meta: add \`title-to-labels-action\` to clean up issue titles
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-10-01¬Fix padding issue in Milestones
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-09-30¬Lint (#3602)
		1234abcd1234abcd1234abcd1234abcd1234abcd¬2020-09-24¬Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)
	`)
}));

test('generates changelog using default options', async () => {
	const output = await generateReleaseNotes({range});

	expect(output).toEqual(dedent(`
		- 1234abcd Update dependencies (#14)
		- 1234abcd Enable \`bypass-checks\` on more commit statuses (#3610)
		- 1234abcd Add tooltip to \`table-input\` button (#3615)
		- 1234abcd Meta: add \`title-to-labels-action\` to clean up issue titles
		- 1234abcd Fix padding issue in Milestones
		- 1234abcd Lint (#3602)
		- 1234abcd Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)

		[\`${range}\`](https://github.com/test/test/compare/${range})
	`));
});

test('generates changelog with custom release template', async () => {
	const output = await generateReleaseNotes({
		range,
		releaseTemplate: dedent(`
			### Changelog

			{commits}

			❤
		`)
	});

	expect(output).toEqual(dedent(`
		### Changelog

		- 1234abcd Update dependencies (#14)
		- 1234abcd Enable \`bypass-checks\` on more commit statuses (#3610)
		- 1234abcd Add tooltip to \`table-input\` button (#3615)
		- 1234abcd Meta: add \`title-to-labels-action\` to clean up issue titles
		- 1234abcd Fix padding issue in Milestones
		- 1234abcd Lint (#3602)
		- 1234abcd Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)

		❤
	`));
});

test('generates changelog with custom commit template', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {title}',
		releaseTemplate: '{commits}'
	});

	expect(output).toEqual(dedent(`
		- Update dependencies (#14)
		- Enable \`bypass-checks\` on more commit statuses (#3610)
		- Add tooltip to \`table-input\` button (#3615)
		- Meta: add \`title-to-labels-action\` to clean up issue titles
		- Fix padding issue in Milestones
		- Lint (#3602)
		- Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)
	`));
});

test('generates changelog with custom exclude', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {title}',
		releaseTemplate: '{commits}',
		exclude: '^Meta|^Lint|^Refactor'
	});

	expect(output).toEqual(dedent(`
		- Update dependencies (#14)
		- Enable \`bypass-checks\` on more commit statuses (#3610)
		- Add tooltip to \`table-input\` button (#3615)
		- Fix padding issue in Milestones
	`));
});

test('generates changelog with exclude preset', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {title}',
		releaseTemplate: '{commits}',
		exclude: 'true'
	});

	expect(output).toEqual(dedent(`
		- Enable \`bypass-checks\` on more commit statuses (#3610)
		- Add tooltip to \`table-input\` button (#3615)
		- Fix padding issue in Milestones
	`));
});

test('generates changelog with date presets', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {date} {title}',
		releaseTemplate: '{commits}'
	});

	expect(output).toEqual(dedent(`
	- 2020-10-07 Update dependencies (#14)
	- 2020-10-06 Enable \`bypass-checks\` on more commit statuses (#3610)
	- 2020-10-05 Add tooltip to \`table-input\` button (#3615)
	- 2020-10-04 Meta: add \`title-to-labels-action\` to clean up issue titles
	- 2020-10-01 Fix padding issue in Milestones
	- 2020-09-30 Lint (#3602)
	- 2020-09-24 Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)
	`));
});

test('generates changelog with custom date presets', async () => {
	const output = await generateReleaseNotes({
		range,
		dateFormat: '--date=format:%d.%m.%Y',
		commitTemplate: '- {date} {title}',
		releaseTemplate: '{commits}'
	});

	expect(output).toEqual(dedent(`
	- 07.10.2020 Update dependencies (#14)
	- 06.10.2020 Enable \`bypass-checks\` on more commit statuses (#3610)
	- 05.10.2020 Add tooltip to \`table-input\` button (#3615)
	- 04.10.2020 Meta: add \`title-to-labels-action\` to clean up issue titles
	- 01.10.2020 Fix padding issue in Milestones
	- 30.09.2020 Lint (#3602)
	- 24.09.2020 Refactor \`conversation-links-on-repo-list\` to use \`selector-observer\` (#3514)
	`));
});
