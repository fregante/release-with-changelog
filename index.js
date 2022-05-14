const {getOctokit, context} = require('@actions/github');
const core = require('@actions/core');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const {generateReleaseNotes} = require('./generate-release-notes');

async function run() {
	try {
		const {owner, repo} = context.repo;

		const releaseTitle = core.getInput('title');
		const releaseTemplate = core.getInput('template');
		const commitTemplate = core.getInput('commit-template');
		const exclude = core.getInput('exclude');
		const dateFormat = core.getInput('date-format');
		const sort = core.getInput('sort');
		const isDraft = core.getInput('draft') === 'true';
		const isPrerelease = core.getInput('prerelease') === 'true';
		const skipOnEmpty = core.getInput('skip-on-empty') === 'true';

		// Fetch tags from remote
		await execFile('git', ['fetch', 'origin', '+refs/tags/*:refs/tags/*']);

		// Get all tags, sorted by recently created tags
		const {stdout: t} = await execFile('git', ['tag', '-l', '--sort=-creatordate']);
		const tags = t.split('\n').filter(Boolean).map(tag => tag.trim());

		if (tags.length === 0) {
			core.info('There is nothing to be done here. Exiting!');
			return;
		}

		let pushedTag = core.getInput('tag') || tags[0];

		if (process.env.GITHUB_REF.startsWith('refs/tags/')) {
			pushedTag = process.env.GITHUB_REF.replace('refs/tags/', '');
			core.info('Using pushed tag as reference: ' + pushedTag);
		}

		// Get range to generate diff
		let range = tags[1] + '..' + pushedTag;
		if (tags.length < 2) {
			const {stdout: rootCommit} = await execFile('git', ['rev-list', '--max-parents=0', 'HEAD']);
			range = rootCommit.trim('') + '..' + pushedTag;
		}

		core.info('Computed range: ' + range);

		const releaseNotes = await generateReleaseNotes({range, exclude, commitTemplate, releaseTemplate, dateFormat, sort, skipOnEmpty});

		// Skip creating release if no commits
		// Explicit check to avoid matching an empty string https://github.com/fregante/release-with-changelog/pull/48#discussion_r719593452
		if (releaseNotes === undefined) {
			core.setOutput('skipped', true);
			return core.info('Skipped creating release for tag `' + pushedTag + '`');
		}

		// Create a release with markdown content in body
		const octokit = getOctokit(core.getInput('token'));
		const createReleaseResponse = await octokit.repos.createRelease({
			repo,
			owner,
			name: releaseTitle.replace('{tag}', pushedTag),
			tag_name: pushedTag, // eslint-disable-line camelcase
			body: releaseNotes,
			draft: isDraft,
			prerelease: isPrerelease
		});

		// Get the ID, html_url, and upload URL for the created Release from the response
		const {
			data: {id: releaseId, html_url: htmlUrl, upload_url: uploadUrl}
		} = createReleaseResponse;

		core.setOutput('skipped', false);
		core.setOutput('id', releaseId);
		core.setOutput('html_url', htmlUrl);
		core.setOutput('upload_url', uploadUrl);
		core.info('Created release `' + createReleaseResponse.data.id + '` for tag `' + pushedTag + '`');
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
