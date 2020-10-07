const childProcess = require('child_process');
const {generateReleaseNotes} = require('./generate-release-notes');

const range = '1234abcd..1234abcd';

jest.mock('child_process');
childProcess.execFile.mockImplementation((file, args, callback) => callback('', {
	stdout: [
		'1234abcd1234abcd1234abcd1234abcd1234abcdUpdate dependencies (#14)',
		'1234abcd1234abcd1234abcd1234abcd1234abcdEnable `bypass-checks` on more commit statuses (#3610)',
		'1234abcd1234abcd1234abcd1234abcd1234abcdAdd tooltip to `table-input` button (#3615)',
		'1234abcd1234abcd1234abcd1234abcd1234abcdMeta: add `title-to-labels-action` to clean up issue titles',
		'1234abcd1234abcd1234abcd1234abcd1234abcdFix padding issue in Milestones',
		'1234abcd1234abcd1234abcd1234abcd1234abcdLint (#3602)',
		'1234abcd1234abcd1234abcd1234abcd1234abcdRefactor `conversation-links-on-repo-list` to use `selector-observer` (#3514)',
	].join('\n')
}));

test('generates changelog using default options', async () => {
	const output = await generateReleaseNotes({range});

	expect(output).toEqual([
		'- 1234abcd Update dependencies (#14)',
		'- 1234abcd Enable `bypass-checks` on more commit statuses (#3610)',
		'- 1234abcd Add tooltip to `table-input` button (#3615)',
		'- 1234abcd Meta: add `title-to-labels-action` to clean up issue titles',
		'- 1234abcd Fix padding issue in Milestones',
		'- 1234abcd Lint (#3602)',
		'- 1234abcd Refactor `conversation-links-on-repo-list` to use `selector-observer` (#3514)',
		'',
		'[`' + range + '`](https://github.com/test/test/compare/' + range +')'
	].join('\n'));
});

test('generates changelog with custom release template', async () => {
	const output = await generateReleaseNotes({
		range,
		releaseTemplate: [
			'### Changelog',
			'',
			'{commits}',
			'',
			'❤'
		].join('\n')
	});

	expect(output).toEqual([
		'### Changelog',
		'',
		'- 1234abcd Update dependencies (#14)',
		'- 1234abcd Enable `bypass-checks` on more commit statuses (#3610)',
		'- 1234abcd Add tooltip to `table-input` button (#3615)',
		'- 1234abcd Meta: add `title-to-labels-action` to clean up issue titles',
		'- 1234abcd Fix padding issue in Milestones',
		'- 1234abcd Lint (#3602)',
		'- 1234abcd Refactor `conversation-links-on-repo-list` to use `selector-observer` (#3514)',
		'',
		'❤'
	].join('\n'));
});

test('generates changelog with custom commit template', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {title}',
		releaseTemplate: '{commits}'
	});

	expect(output).toEqual([
		'- Update dependencies (#14)',
		'- Enable `bypass-checks` on more commit statuses (#3610)',
		'- Add tooltip to `table-input` button (#3615)',
		'- Meta: add `title-to-labels-action` to clean up issue titles',
		'- Fix padding issue in Milestones',
		'- Lint (#3602)',
		'- Refactor `conversation-links-on-repo-list` to use `selector-observer` (#3514)',
	].join('\n'));
});

test('generates changelog with custom exclude', async () => {
	const output = await generateReleaseNotes({
		range,
		commitTemplate: '- {title}',
		releaseTemplate: '{commits}',
		exclude: '^Meta|^Lint|^Refactor'
	});

	expect(output).toEqual([
		'- Update dependencies (#14)',
		'- Enable `bypass-checks` on more commit statuses (#3610)',
		'- Add tooltip to `table-input` button (#3615)',
		'- Fix padding issue in Milestones',
	].join('\n'));
});
